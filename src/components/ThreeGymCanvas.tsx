import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MuscleStats, Exercise } from '../types/game';

interface ThreeGymCanvasProps {
  currentExercise: Exercise;
  muscleStats: MuscleStats;
  isPumpMode: boolean;
  fatigue: number;
  repTrigger: number; // レップが押されるたびにインクリメントされる
  onRepCompleted?: () => void;
}

export const ThreeGymCanvas: React.FC<ThreeGymCanvasProps> = ({
  currentExercise,
  muscleStats,
  isPumpMode,
  fatigue: _fatigue,
  repTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraAngle, setCameraAngle] = useState<'front' | 'side' | 'isometric'>('isometric');

  // Three.js 参照
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // キャラクターパーツ参照
  const characterRef = useRef<{
    root: THREE.Group;
    torso: THREE.Group;
    chestMesh: THREE.Mesh;
    abdomenMesh: THREE.Mesh;
    head: THREE.Mesh;
    leftUpperArm: THREE.Mesh;
    leftLowerArm: THREE.Mesh;
    rightUpperArm: THREE.Mesh;
    rightLowerArm: THREE.Mesh;
    leftUpperLeg: THREE.Mesh;
    leftLowerLeg: THREE.Mesh;
    rightUpperLeg: THREE.Mesh;
    rightLowerLeg: THREE.Mesh;
    barbell: THREE.Group;
    dumbbells: THREE.Group;
    bench: THREE.Group;
    pullupBar: THREE.Group;
    auraLight: THREE.PointLight;
  } | null>(null);

  // アニメーション状態
  const animProgressRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const repTriggerRef = useRef(repTrigger);

  // マウスドラッグによるオービット操作
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ theta: 0.3, phi: 0.35, radius: 4.8 });

  // レップトリガー検知
  useEffect(() => {
    if (repTrigger !== repTriggerRef.current) {
      repTriggerRef.current = repTrigger;
      // レップアニメーション開始
      isAnimatingRef.current = true;
      animProgressRef.current = 0;
    }
  }, [repTrigger]);

  // Three.js 初期化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. シーン
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.08);
    sceneRef.current = scene;

    // 2. カメラ
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. ライティング
    const ambientLight = new THREE.AmbientLight(0x2a3b5c, 1.2);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0x38bdf8, 4.5);
    mainSpot.position.set(3, 6, 4);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.5;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 2.0);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // パンプ時のオーラライト
    const auraLight = new THREE.PointLight(0xf97316, 0, 5);
    auraLight.position.set(0, 1.2, 0);
    scene.add(auraLight);

    // 5. ジム環境（フロア ＆ ネオン）
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.6,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // グリッド装飾ライン
    const grid = new THREE.GridHelper(24, 24, 0x0284c7, 0x1e293b);
    grid.position.y = 0.005;
    scene.add(grid);

    // ネオンウォール
    const wallGeo = new THREE.BoxGeometry(16, 6, 0.2);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 3, -6);
    scene.add(wall);

    // ネオンロゴライトバー
    const neonGeo = new THREE.BoxGeometry(8, 0.12, 0.1);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const neonBar = new THREE.Mesh(neonGeo, neonMat);
    neonBar.position.set(0, 4.5, -5.85);
    scene.add(neonBar);

    // 6. ジム備品（ベンチ台、バーベル、ダンベル、懸垂バー）
    // ベンチ台
    const benchGroup = new THREE.Group();
    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.1, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    benchTop.position.set(0, 0.45, 0);
    benchTop.castShadow = true;
    benchGroup.add(benchTop);

    const benchLeg1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    benchLeg1.position.set(0, 0.225, 0.7);
    benchGroup.add(benchLeg1);
    const benchLeg2 = benchLeg1.clone();
    benchLeg2.position.set(0, 0.225, -0.7);
    benchGroup.add(benchLeg2);
    scene.add(benchGroup);

    // バーベル
    const barbellGroup = new THREE.Group();
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.1 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.castShadow = true;
    barbellGroup.add(bar);

    // プレート (左右)
    const plateGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 24);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const plateL1 = new THREE.Mesh(plateGeo, plateMat);
    plateL1.rotation.z = Math.PI / 2;
    plateL1.position.set(-0.85, 0, 0);
    barbellGroup.add(plateL1);
    const plateL2 = plateL1.clone();
    plateL2.position.set(-0.93, 0, 0);
    barbellGroup.add(plateL2);

    const plateR1 = plateL1.clone();
    plateR1.position.set(0.85, 0, 0);
    barbellGroup.add(plateR1);
    const plateR2 = plateL1.clone();
    plateR2.position.set(0.93, 0, 0);
    barbellGroup.add(plateR2);
    scene.add(barbellGroup);

    // ダンベル
    const dumbbellsGroup = new THREE.Group();
    const createDumbbell = (xPos: number) => {
      const db = new THREE.Group();
      const dbBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
      );
      dbBar.rotation.z = Math.PI / 2;
      db.add(dbBar);
      const dbPlateGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
      const dbP1 = new THREE.Mesh(dbPlateGeo, plateMat);
      dbP1.rotation.z = Math.PI / 2;
      dbP1.position.set(-0.12, 0, 0);
      db.add(dbP1);
      const dbP2 = dbP1.clone();
      dbP2.position.set(0.12, 0, 0);
      db.add(dbP2);
      db.position.set(xPos, 0, 0);
      return db;
    };
    const dbLeft = createDumbbell(-0.4);
    const dbRight = createDumbbell(0.4);
    dumbbellsGroup.add(dbLeft);
    dumbbellsGroup.add(dbRight);
    scene.add(dumbbellsGroup);

    // 懸垂バー (Pull-up Bar)
    const pullupGroup = new THREE.Group();
    const pPost1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    pPost1.position.set(-0.7, 1.25, 0);
    pullupGroup.add(pPost1);
    const pPost2 = pPost1.clone();
    pPost2.position.set(0.7, 1.25, 0);
    pullupGroup.add(pPost2);
    const pTopBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    pTopBar.rotation.z = Math.PI / 2;
    pTopBar.position.set(0, 2.45, 0);
    pullupGroup.add(pTopBar);
    scene.add(pullupGroup);

    // 7. 3D キャラクター（スタイリッシュな筋肉メッシュ）
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0a982,
      roughness: 0.45,
      metalness: 0.1,
    });
    const tankTopMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // 鮮やかなシアン
      roughness: 0.6,
    });
    const shortsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // スタイリッシュダーク
      roughness: 0.7,
    });

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 胴体グループ
    const torso = new THREE.Group();
    rootGroup.add(torso);

    // 胸部 (Chest)
    const chestGeo = new THREE.BoxGeometry(0.55, 0.38, 0.32);
    const chestMesh = new THREE.Mesh(chestGeo, tankTopMat);
    chestMesh.position.y = 1.35;
    chestMesh.castShadow = true;
    torso.add(chestMesh);

    // 腹部 (Abdomen)
    const abdomenGeo = new THREE.BoxGeometry(0.42, 0.32, 0.26);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, tankTopMat);
    abdomenMesh.position.y = 1.05;
    abdomenMesh.castShadow = true;
    torso.add(abdomenMesh);

    // 頭部 (Head)
    const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.72;
    head.castShadow = true;
    torso.add(head);

    // 腕パーツ作成ヘルパー
    const createLimb = (length: number, radius: number, mat: THREE.Material) => {
      const geo = new THREE.CylinderGeometry(radius * 0.9, radius, length, 16);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      return mesh;
    };

    // 腕 (Arms)
    const leftUpperArm = createLimb(0.35, 0.11, skinMat);
    const leftLowerArm = createLimb(0.35, 0.09, skinMat);
    const rightUpperArm = createLimb(0.35, 0.11, skinMat);
    const rightLowerArm = createLimb(0.35, 0.09, skinMat);

    rootGroup.add(leftUpperArm);
    rootGroup.add(leftLowerArm);
    rootGroup.add(rightUpperArm);
    rootGroup.add(rightLowerArm);

    // 脚 (Legs)
    const leftUpperLeg = createLimb(0.48, 0.15, shortsMat);
    const leftLowerLeg = createLimb(0.48, 0.11, skinMat);
    const rightUpperLeg = createLimb(0.48, 0.15, shortsMat);
    const rightLowerLeg = createLimb(0.48, 0.11, skinMat);

    rootGroup.add(leftUpperLeg);
    rootGroup.add(leftLowerLeg);
    rootGroup.add(rightUpperLeg);
    rootGroup.add(rightLowerLeg);

    characterRef.current = {
      root: rootGroup,
      torso,
      chestMesh,
      abdomenMesh,
      head,
      leftUpperArm,
      leftLowerArm,
      rightUpperArm,
      rightLowerArm,
      leftUpperLeg,
      leftLowerLeg,
      rightUpperLeg,
      rightLowerLeg,
      barbell: barbellGroup,
      dumbbells: dumbbellsGroup,
      bench: benchGroup,
      pullupBar: pullupGroup,
      auraLight,
    };

    // 8. アニメーション＆レンダーループ
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // レップアニメーションの進行
      if (isAnimatingRef.current) {
        animProgressRef.current += 0.065;
        if (animProgressRef.current >= 1) {
          animProgressRef.current = 1;
          isAnimatingRef.current = false;
        }
      } else if (animProgressRef.current > 0) {
        // 元の姿勢へスムーズに戻る
        animProgressRef.current = Math.max(0, animProgressRef.current - 0.05);
      }

      // サイン波イージング (0 -> 1 -> 0)
      const p = Math.sin(animProgressRef.current * Math.PI);

      // 種目に応じたポーズ更新
      updateExercisePose(currentExercise.id, p);

      // パンプモードのオーラ演出
      if (characterRef.current) {
        if (isPumpMode) {
          characterRef.current.auraLight.intensity = 3.5 + Math.sin(Date.now() * 0.01) * 1.5;
        } else {
          characterRef.current.auraLight.intensity = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // リサイズハンドラ
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // カメラ位置の更新
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraRotationRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 1.0, 0);
  };

  // 筋肉量・ステータスによる3Dメッシュのビルドアップ（パンプ＆肥大化）
  useEffect(() => {
    if (!characterRef.current) return;
    const { chestMesh, abdomenMesh, leftUpperArm, rightUpperArm, leftUpperLeg, rightUpperLeg } =
      characterRef.current;

    // 大胸筋の厚み (初期レベル10〜200+)
    const chestScale = 1.0 + Math.min(0.6, (muscleStats.chest - 10) * 0.006);
    chestMesh.scale.set(chestScale, 1.0 + (chestScale - 1) * 0.3, chestScale);

    // 腹筋・体幹
    const coreScale = 1.0 + Math.min(0.4, (muscleStats.core - 10) * 0.004);
    abdomenMesh.scale.set(coreScale, 1.0, coreScale);

    // 腕の太さ
    const armScale = 1.0 + Math.min(0.7, (muscleStats.arms - 10) * 0.007);
    leftUpperArm.scale.set(armScale, 1.0, armScale);
    rightUpperArm.scale.set(armScale, 1.0, armScale);

    // 脚の太さ
    const legScale = 1.0 + Math.min(0.6, (muscleStats.legs - 10) * 0.005);
    leftUpperLeg.scale.set(legScale, 1.0, legScale);
    rightUpperLeg.scale.set(legScale, 1.0, legScale);
  }, [muscleStats]);

  // 種目に応じた3Dポーズ＆器具配置の更新
  const updateExercisePose = (exerciseId: string, p: number) => {
    if (!characterRef.current) return;
    const c = characterRef.current;

    // 全器具を一旦非表示に
    c.bench.visible = false;
    c.barbell.visible = false;
    c.dumbbells.visible = false;
    c.pullupBar.visible = false;

    // リセット
    c.root.position.set(0, 0, 0);
    c.root.rotation.set(0, 0, 0);
    c.torso.position.set(0, 0, 0);
    c.torso.rotation.set(0, 0, 0);

    if (exerciseId === 'pushup') {
      // --- 腕立て伏せ (床にうつ伏せ、沈み込んで押し上げる) ---
      const dip = p * 0.22; // 沈み込み量
      c.root.position.set(0, 0.35 - dip, 0);
      c.torso.rotation.x = Math.PI / 2; // うつ伏せ

      c.leftUpperArm.position.set(-0.35, 0.45 - dip, -0.15);
      c.leftUpperArm.rotation.set(Math.PI / 2 + p * 0.6, 0, -0.4);
      c.leftLowerArm.position.set(-0.35, 0.18, -0.15);
      c.leftLowerArm.rotation.set(Math.PI / 2, 0, 0);

      c.rightUpperArm.position.set(0.35, 0.45 - dip, -0.15);
      c.rightUpperArm.rotation.set(Math.PI / 2 + p * 0.6, 0, 0.4);
      c.rightLowerArm.position.set(0.35, 0.18, -0.15);
      c.rightLowerArm.rotation.set(Math.PI / 2, 0, 0);

      c.leftUpperLeg.position.set(-0.16, 0.28, 0.5);
      c.leftUpperLeg.rotation.set(Math.PI / 2, 0, 0);
      c.leftLowerLeg.position.set(-0.16, 0.28, 0.95);
      c.leftLowerLeg.rotation.set(Math.PI / 2, 0, 0);

      c.rightUpperLeg.position.set(0.16, 0.28, 0.5);
      c.rightUpperLeg.rotation.set(Math.PI / 2, 0, 0);
      c.rightLowerLeg.position.set(0.16, 0.28, 0.95);
      c.rightLowerLeg.rotation.set(Math.PI / 2, 0, 0);
    } else if (exerciseId === 'crunch') {
      // --- クランチ / 腹筋 (仰向けで上体を丸める) ---
      c.root.position.set(0, 0.15, 0);
      c.torso.rotation.x = -Math.PI / 2 + p * 0.5; // 上体を起こす
      c.torso.position.y = 0.1 + p * 0.15;

      c.leftUpperArm.position.set(-0.3, 0.25 + p * 0.15, -0.1);
      c.leftUpperArm.rotation.set(-Math.PI / 3, 0, -0.5);
      c.leftLowerArm.position.set(-0.25, 0.4 + p * 0.15, -0.2);

      c.rightUpperArm.position.set(0.3, 0.25 + p * 0.15, -0.1);
      c.rightUpperArm.rotation.set(-Math.PI / 3, 0, 0.5);
      c.rightLowerArm.position.set(0.25, 0.4 + p * 0.15, -0.2);

      // 膝を立てる
      c.leftUpperLeg.position.set(-0.18, 0.35, 0.3);
      c.leftUpperLeg.rotation.set(-Math.PI / 4, 0, 0);
      c.leftLowerLeg.position.set(-0.18, 0.25, 0.6);
      c.leftLowerLeg.rotation.set(Math.PI / 3, 0, 0);

      c.rightUpperLeg.position.set(0.18, 0.35, 0.3);
      c.rightUpperLeg.rotation.set(-Math.PI / 4, 0, 0);
      c.rightLowerLeg.position.set(0.18, 0.25, 0.6);
      c.rightLowerLeg.rotation.set(Math.PI / 3, 0, 0);
    } else if (exerciseId === 'airsquat' || exerciseId === 'barbell_squat') {
      // --- スクワット (深くしゃがみ込んで立ち上がる) ---
      const isBarbell = exerciseId === 'barbell_squat';
      if (isBarbell) {
        c.barbell.visible = true;
      }

      const squatDepth = p * 0.5; // しゃがみ込み深さ
      c.root.position.set(0, -squatDepth, 0);
      c.torso.position.y = -squatDepth * 0.3;
      c.torso.rotation.x = p * 0.25; // やや前傾

      if (isBarbell) {
        c.barbell.position.set(0, 1.5 - squatDepth * 1.3, -0.05);
        c.leftUpperArm.position.set(-0.35, 1.4 - squatDepth * 1.3, 0);
        c.leftUpperArm.rotation.set(0, 0, -0.8);
        c.rightUpperArm.position.set(0.35, 1.4 - squatDepth * 1.3, 0);
        c.rightUpperArm.rotation.set(0, 0, 0.8);
      } else {
        // 自重スクワットは両腕を前方に伸ばす
        c.leftUpperArm.position.set(-0.3, 1.35 - squatDepth * 1.3, 0.25);
        c.leftUpperArm.rotation.set(Math.PI / 2, 0, 0);
        c.rightUpperArm.position.set(0.3, 1.35 - squatDepth * 1.3, 0.25);
        c.rightUpperArm.rotation.set(Math.PI / 2, 0, 0);
      }

      c.leftLowerArm.position.set(-0.3, 1.35 - squatDepth * 1.3, 0.55);
      c.leftLowerArm.rotation.set(Math.PI / 2, 0, 0);
      c.rightLowerArm.position.set(0.3, 1.35 - squatDepth * 1.3, 0.55);
      c.rightLowerArm.rotation.set(Math.PI / 2, 0, 0);

      // 脚の屈曲
      c.leftUpperLeg.position.set(-0.2, 0.7 - squatDepth * 0.8, -p * 0.15);
      c.leftUpperLeg.rotation.set(-p * 1.1, 0, 0);
      c.leftLowerLeg.position.set(-0.2, 0.25, p * 0.1);
      c.leftLowerLeg.rotation.set(p * 1.0, 0, 0);

      c.rightUpperLeg.position.set(0.2, 0.7 - squatDepth * 0.8, -p * 0.15);
      c.rightUpperLeg.rotation.set(-p * 1.1, 0, 0);
      c.rightLowerLeg.position.set(0.2, 0.25, p * 0.1);
      c.rightLowerLeg.rotation.set(p * 1.0, 0, 0);
    } else if (exerciseId === 'bench_press') {
      // --- ベンチプレス (ベンチ台に寝てバーベルを上下) ---
      c.bench.visible = true;
      c.barbell.visible = true;

      c.root.position.set(0, 0, 0);
      c.torso.position.set(0, -0.75, 0);
      c.torso.rotation.x = -Math.PI / 2; // 仰向け

      // バーベル挙上ストローク (胸元 0.8m 〜 挙上 1.25m)
      const pressHeight = 0.8 + (1 - p) * 0.42;
      c.barbell.position.set(0, pressHeight, 0.1);

      c.leftUpperArm.position.set(-0.35, pressHeight - 0.15, 0.1);
      c.leftUpperArm.rotation.set(0, 0, -0.6 + p * 0.6);
      c.leftLowerArm.position.set(-0.35, pressHeight, 0.1);
      c.leftLowerArm.rotation.set(0, 0, 0);

      c.rightUpperArm.position.set(0.35, pressHeight - 0.15, 0.1);
      c.rightUpperArm.rotation.set(0, 0, 0.6 - p * 0.6);
      c.rightLowerArm.position.set(0.35, pressHeight, 0.1);
      c.rightLowerArm.rotation.set(0, 0, 0);

      // 脚はベンチの両脇に降ろす
      c.leftUpperLeg.position.set(-0.3, 0.45, 0.6);
      c.leftUpperLeg.rotation.set(0.3, 0, -0.4);
      c.leftLowerLeg.position.set(-0.3, 0.2, 0.6);
      c.leftLowerLeg.rotation.set(0, 0, 0);

      c.rightUpperLeg.position.set(0.3, 0.45, 0.6);
      c.rightUpperLeg.rotation.set(0.3, 0, 0.4);
      c.rightLowerLeg.position.set(0.3, 0.2, 0.6);
      c.rightLowerLeg.rotation.set(0, 0, 0);
    } else if (exerciseId === 'deadlift') {
      // --- デッドリフト (床からバーベルを引き上げて胸を張る) ---
      c.barbell.visible = true;
      const liftProgress = 1 - p; // 0=床, 1=引き上げ完了

      const hipHeight = 0.7 + liftProgress * 0.15;
      c.torso.position.y = hipHeight - 0.85;
      c.torso.rotation.x = (1 - liftProgress) * 0.6; // 前傾から直立へ

      const barbellY = 0.25 + liftProgress * 0.6;
      c.barbell.position.set(0, barbellY, 0.35);

      c.leftUpperArm.position.set(-0.38, barbellY + 0.35, 0.2);
      c.leftUpperArm.rotation.set(0.3, 0, 0);
      c.leftLowerArm.position.set(-0.38, barbellY + 0.1, 0.3);

      c.rightUpperArm.position.set(0.38, barbellY + 0.35, 0.2);
      c.rightUpperArm.rotation.set(0.3, 0, 0);
      c.rightLowerArm.position.set(0.38, barbellY + 0.1, 0.3);

      c.leftUpperLeg.position.set(-0.2, 0.65, 0);
      c.leftUpperLeg.rotation.set(-(1 - liftProgress) * 0.5, 0, 0);
      c.leftLowerLeg.position.set(-0.2, 0.25, 0);

      c.rightUpperLeg.position.set(0.2, 0.65, 0);
      c.rightUpperLeg.rotation.set(-(1 - liftProgress) * 0.5, 0, 0);
      c.rightLowerLeg.position.set(0.2, 0.25, 0);
    } else if (exerciseId === 'db_curl') {
      // --- ダンベルアームカール (力強く巻き上げる) ---
      c.dumbbells.visible = true;
      c.root.position.set(0, 0, 0);
      c.torso.position.set(0, 0, 0);

      const curlAngle = p * 2.2; // 肘の屈曲
      c.leftUpperArm.position.set(-0.35, 1.25, 0);
      c.leftUpperArm.rotation.set(0, 0, -0.15);
      c.leftLowerArm.position.set(-0.35, 0.95 + p * 0.2, p * 0.2);
      c.leftLowerArm.rotation.set(curlAngle, 0, 0);

      c.rightUpperArm.position.set(0.35, 1.25, 0);
      c.rightUpperArm.rotation.set(0, 0, 0.15);
      c.rightLowerArm.position.set(0.35, 0.95 + p * 0.2, p * 0.2);
      c.rightLowerArm.rotation.set(curlAngle, 0, 0);

      c.dumbbells.position.set(0, 0.75 + p * 0.45, p * 0.25);

      // 直立脚
      c.leftUpperLeg.position.set(-0.18, 0.7, 0);
      c.leftLowerLeg.position.set(-0.18, 0.25, 0);
      c.rightUpperLeg.position.set(0.18, 0.7, 0);
      c.rightLowerLeg.position.set(0.18, 0.25, 0);
    } else if (exerciseId === 'pullup') {
      // --- 懸垂 (バーにぶら下がって引き上げる) ---
      c.pullupBar.visible = true;
      const pullHeight = 1.2 + p * 0.45;
      c.root.position.set(0, pullHeight - 1.2, 0);

      c.leftUpperArm.position.set(-0.4, 2.1, 0);
      c.leftUpperArm.rotation.set(0, 0, -0.9 + p * 0.7);
      c.leftLowerArm.position.set(-0.45, 2.35, 0);

      c.rightUpperArm.position.set(0.4, 2.1, 0);
      c.rightUpperArm.rotation.set(0, 0, 0.9 - p * 0.7);
      c.rightLowerArm.position.set(0.45, 2.35, 0);

      // 脚を少し後ろでクロス
      c.leftUpperLeg.position.set(-0.16, 0.65, -0.1);
      c.leftUpperLeg.rotation.set(0.3, 0, 0);
      c.leftLowerLeg.position.set(-0.16, 0.25, -0.25);
      c.leftLowerLeg.rotation.set(0.7, 0, 0);

      c.rightUpperLeg.position.set(0.16, 0.65, -0.1);
      c.rightUpperLeg.rotation.set(0.3, 0, 0);
      c.rightLowerLeg.position.set(0.16, 0.25, -0.25);
      c.rightLowerLeg.rotation.set(0.7, 0, 0);
    } else {
      // デフォルト（直立・待機ポーズ）
      c.root.position.set(0, 0, 0);
      c.leftUpperArm.position.set(-0.35, 1.25, 0);
      c.leftUpperArm.rotation.set(0, 0, -0.15);
      c.leftLowerArm.position.set(-0.35, 0.95, 0);
      c.leftLowerArm.rotation.set(0, 0, 0);

      c.rightUpperArm.position.set(0.35, 1.25, 0);
      c.rightUpperArm.rotation.set(0, 0, 0.15);
      c.rightLowerArm.position.set(0.35, 0.95, 0);
      c.rightLowerArm.rotation.set(0, 0, 0);

      c.leftUpperLeg.position.set(-0.18, 0.7, 0);
      c.leftLowerLeg.position.set(-0.18, 0.25, 0);
      c.rightUpperLeg.position.set(0.18, 0.7, 0);
      c.rightLowerLeg.position.set(0.18, 0.25, 0);
    }
  };

  // マウスドラッグでカメラ回転
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraRotationRef.current.theta += deltaX * 0.008;
    cameraRotationRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.05, cameraRotationRef.current.phi - deltaY * 0.008)
    );

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // タッチ操作対応
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
    const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

    cameraRotationRef.current.theta += deltaX * 0.01;
    cameraRotationRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.05, cameraRotationRef.current.phi - deltaY * 0.01)
    );

    previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    updateCameraPosition();
  };

  // プリセットカメラ視点切り替え
  const setPresetAngle = (preset: 'front' | 'side' | 'isometric') => {
    setCameraAngle(preset);
    if (preset === 'front') {
      cameraRotationRef.current = { theta: 0, phi: 0.25, radius: 4.5 };
    } else if (preset === 'side') {
      cameraRotationRef.current = { theta: Math.PI / 2, phi: 0.3, radius: 4.8 };
    } else {
      cameraRotationRef.current = { theta: 0.35, phi: 0.35, radius: 4.8 };
    }
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 select-none">
      {/* 3D WebGL キャンバス */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />

      {/* カメラアングル切り替えボタン */}
      <div className="absolute top-4 right-4 flex bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setPresetAngle('isometric')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
            cameraAngle === 'isometric'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          斜め (3D)
        </button>
        <button
          onClick={() => setPresetAngle('front')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
            cameraAngle === 'front'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          正面
        </button>
        <button
          onClick={() => setPresetAngle('side')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
            cameraAngle === 'side'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          真横
        </button>
      </div>

      {/* 画面ドラッグガイド */}
      <div className="absolute top-4 left-4 bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
        <span>🎮</span>
        <span>画面ドラッグで360°回転鑑賞</span>
      </div>

      {/* 種目名＆パンプバッジ */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-xl">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
            NOW TRAINING
          </div>
          <div className="text-lg font-black text-white font-display flex items-center gap-2">
            <span>{currentExercise.name}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Lv.{currentExercise.level}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
