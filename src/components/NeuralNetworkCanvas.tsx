import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  NetworkGraph,
  NetworkNodeData,
  calculateGameCameraTarget,
  evaluateInGameGuess,
} from '../utils/transformerLogic.ts';
import { ThemeColor } from '../utils/constants.ts';

interface NeuralNetworkCanvasProps {
  graph: NetworkGraph;
  currentStepIndex: number;
  theme: ThemeColor;
  noiseIntensity: number;
  streak: number;
  resetCameraTrigger?: number;
  highlightHintNodeId?: string | null;
  onCameraIsCustomized?: (isCustom: boolean) => void;
  onGuessResult: (result: {
    isCorrect: boolean;
    pointsEarned: number;
    newStreak: number;
    feedbackText: string;
    tappedNode: NetworkNodeData;
  }) => void;
  onAdvanceToNextLayer: () => void;
}

export function NeuralNetworkCanvas({
  graph,
  currentStepIndex,
  theme,
  noiseIntensity,
  streak,
  resetCameraTrigger,
  highlightHintNodeId,
  onCameraIsCustomized,
  onGuessResult,
  onAdvanceToNextLayer,
}: NeuralNetworkCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const currentStepRef = useRef(currentStepIndex);
  currentStepRef.current = currentStepIndex;

  const streakRef = useRef(streak);
  streakRef.current = streak;

  const onGuessCallbackRef = useRef(onGuessResult);
  onGuessCallbackRef.current = onGuessResult;

  const onAdvanceCallbackRef = useRef(onAdvanceToNextLayer);
  onAdvanceCallbackRef.current = onAdvanceToNextLayer;

  const noiseRef = useRef(noiseIntensity);
  noiseRef.current = noiseIntensity;

  const isUserControlledRef = useRef(false);
  const onCameraIsCustomizedRef = useRef(onCameraIsCustomized);
  onCameraIsCustomizedRef.current = onCameraIsCustomized;

  // Scene references
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const linksGroupRef = useRef<THREE.Group | null>(null);
  const labelsGroupRef = useRef<THREE.Group | null>(null);
  const pulseGroupRef = useRef<THREE.Group | null>(null);
  const fxGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const attemptsOnLayerRef = useRef(0);

  useEffect(() => {
    attemptsOnLayerRef.current = 0;
    // When moving to new layer, smoothly realign camera back to track
    isUserControlledRef.current = false;
    onCameraIsCustomizedRef.current?.(false);
  }, [currentStepIndex, graph.sentenceIndex]);

  // Handle external Reset Camera button trigger
  useEffect(() => {
    if (resetCameraTrigger !== undefined) {
      isUserControlledRef.current = false;
      onCameraIsCustomizedRef.current?.(false);
    }
  }, [resetCameraTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobile = window.innerWidth < 768;

    // 1. Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.007);

    // 2. Camera setup: wider FOV on mobile so all 4 vertical nodes fit comfortably
    const camera = new THREE.PerspectiveCamera(isMobile ? 62 : 52, width / height, 0.1, 1000);
    const startX = graph.targetPath[0]?.posX || 0;
    const initCam = calculateGameCameraTarget(startX, isMobile);
    camera.position.set(initCam.position.x, initCam.position.y, initCam.position.z);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (allow free user camera exploration, with safe clamps)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 8;
    controls.maxDistance = 75;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI * 0.82;
    controls.target.set(initCam.lookAt.x, initCam.lookAt.y, initCam.lookAt.z);
    controlsRef.current = controls;

    // Listen to user interaction to enable free camera mode
    const onControlsStart = () => {
      isUserControlledRef.current = true;
      onCameraIsCustomizedRef.current?.(true);
    };
    controls.addEventListener('start', onControlsStart);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(theme.hex, 2.2);
    keyLight.position.set(10, 30, 20);
    scene.add(keyLight);

    const pointLight = new THREE.PointLight(theme.activeHex, 2.8, 90);
    pointLight.position.set(0, 10, 15);
    scene.add(pointLight);

    // 6. Object Groups
    const networkGroup = new THREE.Group();
    const nodesGroup = new THREE.Group();
    const linksGroup = new THREE.Group();
    const labelsGroup = new THREE.Group();
    const pulseGroup = new THREE.Group();
    const fxGroup = new THREE.Group();
    const particlesGroup = new THREE.Group();

    networkGroup.add(linksGroup);
    networkGroup.add(nodesGroup);
    networkGroup.add(labelsGroup);
    networkGroup.add(pulseGroup);
    networkGroup.add(fxGroup);
    scene.add(networkGroup);
    scene.add(particlesGroup);

    nodesGroupRef.current = nodesGroup;
    linksGroupRef.current = linksGroup;
    labelsGroupRef.current = labelsGroup;
    pulseGroupRef.current = pulseGroup;
    fxGroupRef.current = fxGroup;

    // 7. Starfield Background
    const starCount = isMobile ? 350 : 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 220;
      starPos[i + 1] = (Math.random() - 0.5) * 180;
      starPos[i + 2] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: theme.hex,
      size: 0.9,
      transparent: true,
      opacity: 0.4,
    });
    const starField = new THREE.Points(starGeo, starMat);
    particlesGroup.add(starField);

    // 8. Canvas Label Sprites
    function drawNodeLabel(
      canvas: HTMLCanvasElement,
      text: string,
      status: 'active-choice' | 'target-won' | 'passed' | 'wrong' | 'future'
    ) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 340;
      canvas.height = 88;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const x = 12, y = 10, w = canvas.width - 24, h = canvas.height - 20, r = 14;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();

      if (status === 'target-won') {
        ctx.fillStyle = 'rgba(6, 78, 59, 0.95)';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3.5;
      } else if (status === 'active-choice') {
        ctx.fillStyle = 'rgba(8, 20, 36, 0.92)';
        ctx.strokeStyle = theme.cssColor;
        ctx.lineWidth = 3;
      } else if (status === 'wrong') {
        ctx.fillStyle = 'rgba(120, 30, 20, 0.92)';
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
      } else if (status === 'passed') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = 1;
      }

      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 24px "Vazirmatn", "Segoe UI", sans-serif';
      ctx.fillStyle = status === 'future' ? '#64748b' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
    }

    function createNodeSprite(text: string, status: 'active-choice' | 'target-won' | 'passed' | 'wrong' | 'future') {
      const canvas = document.createElement('canvas');
      drawNodeLabel(canvas, text, status);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });

      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(7.4, 1.9, 1);
      sprite.userData = { canvas, text, status };
      return sprite;
    }

    function spawnFloatingScoreText(worldPos: THREE.Vector3, text: string, color: string = '#fbbf24') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 256;
      canvas.height = 70;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 30px "Vazirmatn", "JetBrains Mono", sans-serif';
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
        })
      );
      sprite.position.copy(worldPos);
      sprite.position.y += 2.8;
      sprite.scale.set(5.5, 1.5, 1);
      fxGroup.add(sprite);

      const startTime = performance.now();
      const animateFloat = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        sprite.position.y += 0.04;
        sprite.material.opacity = Math.max(0, 1 - elapsed * 1.2);
        if (elapsed < 1.0) {
          requestAnimationFrame(animateFloat);
        } else {
          fxGroup.remove(sprite);
          texture.dispose();
          sprite.material.dispose();
        }
      };
      requestAnimationFrame(animateFloat);
    }

    function spawnCelebrationBurst(worldPos: THREE.Vector3) {
      const pCount = 32;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      const vels: THREE.Vector3[] = [];

      for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = worldPos.x;
        pPos[i * 3 + 1] = worldPos.y;
        pPos[i * 3 + 2] = worldPos.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 3.5 + Math.random() * 5.5;
        vels.push(
          new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed,
            Math.sin(phi) * Math.sin(theta) * speed
          )
        );
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

      const pMat = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 0.95,
        transparent: true,
        opacity: 1.0,
      });
      const points = new THREE.Points(pGeo, pMat);
      fxGroup.add(points);

      const start = performance.now();
      const animateBurst = () => {
        const elapsed = (performance.now() - start) / 1000;
        const positions = pGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          positions[i * 3] += vels[i].x * 0.02;
          positions[i * 3 + 1] += vels[i].y * 0.02;
          positions[i * 3 + 2] += vels[i].z * 0.02;
        }
        pGeo.attributes.position.needsUpdate = true;
        pMat.opacity = Math.max(0, 1 - elapsed * 1.5);

        if (elapsed < 0.8) {
          requestAnimationFrame(animateBurst);
        } else {
          fxGroup.remove(points);
          pGeo.dispose();
          pMat.dispose();
        }
      };
      requestAnimationFrame(animateBurst);
    }

    // 9. Reconstruct Graph
    const sphereGeo = new THREE.SphereGeometry(0.9, 20, 20);

    graph.layers.forEach((layer, lIdx) => {
      layer.forEach((nodeData) => {
        const isPassedLayer = lIdx < currentStepRef.current;
        const isActiveLayer = lIdx === currentStepRef.current;

        const mat = new THREE.MeshStandardMaterial({
          color: isActiveLayer ? theme.activeHex : isPassedLayer ? theme.hex : 0x1e293b,
          emissive: isActiveLayer ? theme.activeHex : isPassedLayer ? theme.hex : 0x051020,
          emissiveIntensity: isActiveLayer ? 0.9 : isPassedLayer ? 0.6 : 0.15,
          roughness: 0.2,
          metalness: 0.8,
        });

        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.set(nodeData.posX, nodeData.posY, nodeData.posZ);
        mesh.userData = { ...nodeData, basePos: new THREE.Vector3(nodeData.posX, nodeData.posY, nodeData.posZ) };
        nodesGroup.add(mesh);

        let labelStatus: 'active-choice' | 'target-won' | 'passed' | 'wrong' | 'future' = 'future';
        if (isPassedLayer) {
          labelStatus = nodeData.isTarget ? 'target-won' : 'passed';
        } else if (isActiveLayer) {
          labelStatus = 'active-choice';
        }

        const sprite = createNodeSprite(nodeData.word, labelStatus);
        sprite.position.set(nodeData.posX, nodeData.posY + 2.05, nodeData.posZ);
        sprite.userData = { ...sprite.userData, parentMesh: mesh, nodeData };
        labelsGroup.add(sprite);
      });
    });

    // Connections between adjacent target nodes
    // Line ONLY becomes visible when user has correctly selected both nodes (strictly up to currentStepIndex - 1)
    for (let l = 0; l < graph.layers.length - 1; l++) {
      const targetA = graph.targetPath[l];
      const targetB = graph.targetPath[l + 1];
      if (targetA && targetB) {
        const points = [
          new THREE.Vector3(targetA.posX, targetA.posY, targetA.posZ),
          new THREE.Vector3(targetB.posX, targetB.posY, targetB.posZ),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.95,
          linewidth: 2.5,
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { nodeA: targetA, nodeB: targetB };
        // Strictly hidden until user correctly reaches targetB.layer
        line.visible = targetB.layer < currentStepRef.current;
        linksGroup.add(line);
      }
    }

    // Font ready refresh
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        labelsGroup.children.forEach((spriteObj) => {
          const sprite = spriteObj as THREE.Sprite;
          const { canvas, text, status } = sprite.userData || {};
          if (canvas && text && status) {
            drawNodeLabel(canvas, text, status);
            if (sprite.material.map) {
              sprite.material.map.needsUpdate = true;
            }
          }
        });
      });
    }

    // 10. Pointer Interactions (In-Game Tapping on 3D Nodes)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let isClickAction = false;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      isClickAction = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 7) {
        isClickAction = false;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isClickAction) return;

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodesGroup.children);
      if (hits.length === 0) return;

      const tappedMesh = hits[0].object as THREE.Mesh;
      const nodeData = tappedMesh.userData as NetworkNodeData;
      if (!nodeData) return;

      const curStep = currentStepRef.current;
      if (nodeData.layer !== curStep) return;

      const result = evaluateInGameGuess(nodeData, streakRef.current, attemptsOnLayerRef.current);
      attemptsOnLayerRef.current += 1;

      if (onGuessCallbackRef.current) {
        onGuessCallbackRef.current({
          ...result,
          tappedNode: nodeData,
        });
      }

      const matchingSprite = labelsGroup.children.find(
        (s) => s.userData?.nodeData?.id === nodeData.id
      ) as THREE.Sprite | undefined;

      if (result.isCorrect) {
        spawnCelebrationBurst(tappedMesh.position);
        spawnFloatingScoreText(tappedMesh.position, `+${result.pointsEarned} XP ⭐`, '#34d399');

        const mat = tappedMesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x10b981);
        mat.emissiveIntensity = 2.2;
        tappedMesh.scale.set(1.5, 1.5, 1.5);

        if (matchingSprite) {
          drawNodeLabel(matchingSprite.userData.canvas, nodeData.word, 'target-won');
          matchingSprite.material.map!.needsUpdate = true;
        }

        // Localized victory aura ripple at tapped node (does not fly to next secret word)
        const auraGeo = new THREE.RingGeometry(0.8, 1.4, 32);
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });
        const auraMesh = new THREE.Mesh(auraGeo, auraMat);
        auraMesh.position.copy(tappedMesh.position);
        auraMesh.position.z += 0.2;
        pulseGroup.add(auraMesh);

        const startP = performance.now();
        const duration = 550;
        const animateP = () => {
          const p = Math.min((performance.now() - startP) / duration, 1.0);
          const currentScale = 1.0 + p * 2.2;
          auraMesh.scale.set(currentScale, currentScale, currentScale);
          auraMat.opacity = Math.max(0, 0.9 * (1.0 - p));
          if (p < 1.0 && pulseGroup.children.includes(auraMesh)) {
            requestAnimationFrame(animateP);
          } else {
            pulseGroup.remove(auraMesh);
            auraGeo.dispose();
            auraMat.dispose();
          }
        };
        requestAnimationFrame(animateP);

        setTimeout(() => {
          if (onAdvanceCallbackRef.current) {
            onAdvanceCallbackRef.current();
          }
        }, 850);
      } else {
        spawnFloatingScoreText(tappedMesh.position, '❌ دوباره تلاش کن', '#f87171');
        const origX = tappedMesh.position.x;
        let shakeFrames = 0;
        const animateShake = () => {
          shakeFrames++;
          tappedMesh.position.x = origX + Math.sin(shakeFrames * 1.5) * 0.35;
          if (shakeFrames < 16) {
            requestAnimationFrame(animateShake);
          } else {
            tappedMesh.position.x = origX;
          }
        };
        animateShake();

        if (matchingSprite) {
          drawNodeLabel(matchingSprite.userData.canvas, `${nodeData.word} (${Math.round(nodeData.probability * 100)}%)`, 'wrong');
          matchingSprite.material.map!.needsUpdate = true;
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const isMob = window.innerWidth < 768;
      camera.aspect = w / h;
      camera.fov = isMob ? 62 : 52;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 11. Render Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const stageSpeed = 1.0 + graph.sentenceIndex * 0.16;
      const noise = noiseRef.current;
      nodesGroup.children.forEach((mesh) => {
        const data = mesh.userData;
        if (data && data.basePos) {
          const nx = Math.sin(elapsed * 1.3 * stageSpeed + data.basePos.y) * 0.15 * noise;
          const ny = Math.cos(elapsed * 1.1 * stageSpeed + data.basePos.x) * 0.15 * noise;
          mesh.position.set(data.basePos.x + nx, data.basePos.y + ny, data.basePos.z);
        }
      });

      labelsGroup.children.forEach((sprite) => {
        const parent = sprite.userData?.parentMesh;
        if (parent) {
          sprite.position.set(parent.position.x, parent.position.y + 2.05, parent.position.z);
        }
      });

      linksGroup.children.forEach((lineObj) => {
        const line = lineObj as THREE.Line;
        const { nodeA, nodeB } = line.userData;
        if (nodeA && nodeB) {
          const meshA = nodesGroup.children.find((m) => m.userData?.id === nodeA.id);
          const meshB = nodesGroup.children.find((m) => m.userData?.id === nodeB.id);
          if (meshA && meshB) {
            const posAttr = line.geometry.attributes.position;
            posAttr.setXYZ(0, meshA.position.x, meshA.position.y, meshA.position.z);
            posAttr.setXYZ(1, meshB.position.x, meshB.position.y, meshB.position.z);
            posAttr.needsUpdate = true;
          }
        }
      });

      starField.rotation.y = elapsed * 0.015 * stageSpeed;
      starField.rotation.x = elapsed * 0.005 * stageSpeed;

      // Camera Glide: Only auto-lerp if user is NOT currently in custom free-camera exploration mode!
      if (!isUserControlledRef.current) {
        const activeLayerIdx = currentStepRef.current;
        const activeTargetNode = graph.targetPath[activeLayerIdx] || graph.targetPath[0];
        if (activeTargetNode) {
          const isMob = window.innerWidth < 768;
          const gameCam = calculateGameCameraTarget(activeTargetNode.posX, isMob);

          const dampFactor = 1 - Math.exp(-4.2 * delta);
          camera.position.lerp(
            new THREE.Vector3(gameCam.position.x, gameCam.position.y, gameCam.position.z),
            dampFactor
          );
          controls.target.lerp(
            new THREE.Vector3(gameCam.lookAt.x, gameCam.lookAt.y, gameCam.lookAt.z),
            dampFactor
          );
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      controls.removeEventListener('start', onControlsStart);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);

      sphereGeo.dispose();
      starGeo.dispose();
      starMat.dispose();

      nodesGroup.children.forEach((mesh) => {
        const m = mesh as THREE.Mesh;
        if (m.material) {
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material.dispose();
        }
      });

      labelsGroup.children.forEach((s) => {
        const sprite = s as THREE.Sprite;
        sprite.material.map?.dispose();
        sprite.material.dispose();
      });

      linksGroup.children.forEach((l) => {
        const line = l as THREE.Line;
        line.geometry.dispose();
        if (line.material) {
          if (Array.isArray(line.material)) line.material.forEach((mat) => mat.dispose());
          else line.material.dispose();
        }
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [graph, theme]);

  // Update visual states and struggle hint highlighting
  useEffect(() => {
    const nodesGroup = nodesGroupRef.current;
    const labelsGroup = labelsGroupRef.current;
    if (!nodesGroup || !labelsGroup) return;

    graph.layers.forEach((layer, lIdx) => {
      const isPassed = lIdx < currentStepIndex;
      const isCurrent = lIdx === currentStepIndex;

      layer.forEach((nodeData) => {
        const mesh = nodesGroup.children.find((m) => m.userData?.id === nodeData.id) as THREE.Mesh | undefined;
        const sprite = labelsGroup.children.find((s) => s.userData?.nodeData?.id === nodeData.id) as THREE.Sprite | undefined;

        const isHintTarget = highlightHintNodeId === nodeData.id;

        if (mesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (isHintTarget) {
            mat.emissive.setHex(0xfbbf24);
            mat.emissiveIntensity = 2.4;
            mesh.scale.set(1.5, 1.5, 1.5);
          } else if (isCurrent) {
            mat.emissive.setHex(theme.activeHex);
            mat.emissiveIntensity = 1.3;
            mesh.scale.set(1.3, 1.3, 1.3);
          } else if (isPassed) {
            mat.emissive.setHex(nodeData.isTarget ? 0x10b981 : 0x0a192f);
            mat.emissiveIntensity = nodeData.isTarget ? 0.8 : 0.1;
            mesh.scale.set(nodeData.isTarget ? 1.1 : 0.85, nodeData.isTarget ? 1.1 : 0.85, nodeData.isTarget ? 1.1 : 0.85);
          } else {
            mat.emissive.setHex(0x051020);
            mat.emissiveIntensity = 0.15;
            mesh.scale.set(0.9, 0.9, 0.9);
          }
        }

        if (sprite && sprite.userData?.canvas) {
          let st: 'active-choice' | 'target-won' | 'passed' | 'wrong' | 'future' = 'future';
          if (isPassed) {
            st = nodeData.isTarget ? 'target-won' : 'passed';
          } else if (isCurrent) {
            st = 'active-choice';
          }

          const ctx = sprite.userData.canvas.getContext('2d');
          if (ctx) {
            const canvas = sprite.userData.canvas;
            canvas.width = 340;
            canvas.height = 88;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const x = 12, y = 10, w = canvas.width - 24, h = canvas.height - 20, r = 14;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();

            if (isHintTarget) {
              ctx.fillStyle = 'rgba(120, 80, 10, 0.95)';
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 4;
            } else if (st === 'target-won') {
              ctx.fillStyle = 'rgba(6, 78, 59, 0.95)';
              ctx.strokeStyle = '#34d399';
              ctx.lineWidth = 3.5;
            } else if (st === 'active-choice') {
              ctx.fillStyle = 'rgba(8, 20, 36, 0.92)';
              ctx.strokeStyle = theme.cssColor;
              ctx.lineWidth = 3;
            } else if (st === 'passed') {
              ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
              ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
              ctx.lineWidth = 1.5;
            } else {
              ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
              ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
              ctx.lineWidth = 1;
            }
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 24px "Vazirmatn", "Segoe UI", sans-serif';
            ctx.fillStyle = st === 'future' ? '#64748b' : '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(nodeData.word, canvas.width / 2, canvas.height / 2 + 1);

            sprite.material.map!.needsUpdate = true;
          }
        }
      });
    });

    // Dynamically update connection lines:
    // Line is ONLY visible for steps that have ALREADY been correctly selected by the user!
    // It NEVER extends into the active layer (currentStepIndex) or any future layers!
    const linksGroup = linksGroupRef.current;
    if (linksGroup) {
      linksGroup.children.forEach((l) => {
        const line = l as THREE.Line;
        const { nodeA, nodeB } = line.userData || {};
        if (nodeA && nodeB) {
          const isCompletedTargetLink = Boolean(
            nodeA.isTarget && nodeB.isTarget && nodeB.layer < currentStepIndex
          );
          line.visible = isCompletedTargetLink;
          if (isCompletedTargetLink) {
            const mat = line.material as THREE.LineBasicMaterial;
            mat.color.setHex(0x10b981);
            mat.opacity = 0.95;
            mat.linewidth = 2.5;
            mat.needsUpdate = true;
          }
        }
      });
    }
  }, [currentStepIndex, graph, theme, highlightHintNodeId]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full z-0 cursor-pointer touch-none select-none"
      data-testid="three-canvas-container"
    />
  );
}
