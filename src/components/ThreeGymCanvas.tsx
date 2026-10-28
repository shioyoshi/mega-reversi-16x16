import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MuscleStats, Exercise } from '../types/game';

interface ThreeGymCanvasProps {
  currentExercise: Exercise;
  muscleStats: MuscleStats;
  isPumpMode: boolean;
  fatigue: number;
  repTrigger: number;
}

export const ThreeGymCanvas: React.FC<ThreeGymCanvasProps> = ({
  currentExercise,
  muscleStats,
  isPumpMode,
  fatigue: _fatigue,
  repTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // 常に最新の currentExercise を参照するための ref
  const currentExerciseRef = useRef(currentExercise);
  currentExerciseRef.current = currentExercise;

  const [activeView, setActiveView] = useState<'diagonal' | 'front' | 'side'>('diagonal');

  // アニメーション関連
  const animProgressRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const repTriggerRef = useRef(repTrigger);

  // キャラクターのパーツ参照
  const characterRef = useRef<{
    root: THREE.Group;
    body: THREE.Group; // 全身グループ
    torso: THREE.Group; // 上半身
    chestMesh: THREE.Mesh;
    abdomenMesh: THREE.Mesh;
    head: THREE.Mesh;
    leftUpperArm: THREE.Mesh;
    leftLowerArm: THREE.Mesh;
    rightUpperArm: THREE.Mesh;
    rightLowerArm: THREE.Mesh;
    hips: THREE.Group; // 下半身
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

  // レップトリガー検知
  useEffect(() => {
    if (repTrigger !== repTriggerRef.current) {
      repTriggerRef.current = repTrigger;
      isAnimatingRef.current = true;
      animProgressRef.current = 0;
    }
  }, [repTrigger]);

  // Three.js シーンの初期化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. シーン
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.06);

    // 2. カメラ
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.5, 2.2, 4.0);
    cameraRef.current = camera;

    // 3. レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 4. OrbitControls (安全で滑らかなカメラ操作)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.05, 0); // キャラクターの胸あたりを注視
    controls.minDistance = 2.0;
    controls.maxDistance = 8.0;
    // 地面より下に潜らないように制限
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    // 真上垂直になりすぎて特異点（NaN）に触れないように制限
    controls.minPolarAngle = 0.25;
    controlsRef.current = controls;

    // 5. ライティング
    const ambientLight = new THREE.AmbientLight(0x384c70, 1.4);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0x38bdf8, 5.0);
    mainSpot.position.set(3.5, 7.0, 4.5);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.6;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 2.5);
    rimLight.position.set(-4.0, 3.5, -4.0);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x0284c7, 1.5);
    fillLight.position.set(-3.0, 4.0, 3.0);
    scene.add(fillLight);

    // パンプ時の爆発的オーラライト
    const auraLight = new THREE.PointLight(0xf97316, 0, 6);
    auraLight.position.set(0, 1.2, 0);
    scene.add(auraLight);

    // 6. ジム環境（フロア、ネオンウォール、グリッド）
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    grid.position.y = 0.005;
    scene.add(grid);

    // ネオンウォール
    const wallGeo = new THREE.BoxGeometry(20, 8, 0.3);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.8 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 4, -7);
    scene.add(wall);

    // ネオンバー
    const neonGeo = new THREE.BoxGeometry(10, 0.15, 0.1);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const neonBar = new THREE.Mesh(neonGeo, neonMat);
    neonBar.position.set(0, 5.5, -6.8);
    scene.add(neonBar);

    // 7. ジム備品（ベンチ台、バーベル、ダンベル、懸垂バー）
    // ベンチ台
    const benchGroup = new THREE.Group();
    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    benchTop.position.set(0, 0.45, 0);
    benchTop.castShadow = true;
    benchGroup.add(benchTop);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const bLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45), legMat);
    bLeg1.position.set(0, 0.225, 0.65);
    bLeg1.castShadow = true;
    benchGroup.add(bLeg1);

    const bLeg2 = bLeg1.clone();
    bLeg2.position.set(0, 0.225, -0.65);
    benchGroup.add(bLeg2);
    scene.add(benchGroup);

    // バーベル
    const barbellGroup = new THREE.Group();
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 2.3),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.castShadow = true;
    barbellGroup.add(bar);

    const plateGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 24);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const pL1 = new THREE.Mesh(plateGeo, plateMat);
    pL1.rotation.z = Math.PI / 2;
    pL1.position.set(-0.9, 0, 0);
    pL1.castShadow = true;
    barbellGroup.add(pL1);
    const pL2 = pL1.clone();
    pL2.position.set(-0.98, 0, 0);
    barbellGroup.add(pL2);

    const pR1 = pL1.clone();
    pR1.position.set(0.9, 0, 0);
    barbellGroup.add(pR1);
    const pR2 = pL1.clone();
    pR2.position.set(0.98, 0, 0);
    barbellGroup.add(pR2);
    scene.add(barbellGroup);

    // ダンベル
    const dumbbellsGroup = new THREE.Group();
    const createDumbbell = (xPos: number) => {
      const db = new THREE.Group();
      const dbBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
      );
      dbBar.rotation.z = Math.PI / 2;
      db.add(dbBar);
      const dbPGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
      const dbP1 = new THREE.Mesh(dbPGeo, plateMat);
      dbP1.rotation.z = Math.PI / 2;
      dbP1.position.set(-0.14, 0, 0);
      db.add(dbP1);
      const dbP2 = dbP1.clone();
      dbP2.position.set(0.14, 0, 0);
      db.add(dbP2);
      db.position.set(xPos, 0, 0);
      return db;
    };
    dumbbellsGroup.add(createDumbbell(-0.45));
    dumbbellsGroup.add(createDumbbell(0.45));
    scene.add(dumbbellsGroup);

    // 懸垂バー
    const pullupGroup = new THREE.Group();
    const pPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6), legMat);
    pPost1.position.set(-0.75, 1.3, 0);
    pullupGroup.add(pPost1);
    const pPost2 = pPost1.clone();
    pPost2.position.set(0.75, 1.3, 0);
    pullupGroup.add(pPost2);
    const pTopBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 })
    );
    pTopBar.rotation.z = Math.PI / 2;
    pTopBar.position.set(0, 2.55, 0);
    pullupGroup.add(pTopBar);
    scene.add(pullupGroup);

    // 8. 階層型 3D キャラクター（頑丈な骨格階層構造）
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0a982, roughness: 0.45 });
    const tankTopMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

    const root = new THREE.Group();
    scene.add(root);

    const body = new THREE.Group();
    root.add(body);

    // 胴体グループ (腰の位置をピボットにする)
    const torso = new THREE.Group();
    torso.position.set(0, 0.95, 0);
    body.add(torso);

    // 腹部
    const abdomenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.26), tankTopMat);
    abdomenMesh.position.y = 0.15;
    abdomenMesh.castShadow = true;
    torso.add(abdomenMesh);

    // 胸部
    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.32), tankTopMat);
    chestMesh.position.y = 0.46;
    chestMesh.castShadow = true;
    torso.add(chestMesh);

    // 頭部
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), skinMat);
    head.position.y = 0.82;
    head.castShadow = true;
    torso.add(head);

    // リム作成ヘルパー
    const createLimb = (length: number, radius: number, mat: THREE.Material) => {
      const geo = new THREE.CylinderGeometry(radius * 0.9, radius, length, 16);
      geo.translate(0, -length / 2, 0); // ピボットを関節上端にする
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      return mesh;
    };

    // 腕 (胸の左右から生える)
    const leftUpperArm = createLimb(0.35, 0.11, skinMat);
    leftUpperArm.position.set(-0.35, 0.6, 0);
    torso.add(leftUpperArm);

    const leftLowerArm = createLimb(0.35, 0.09, skinMat);
    leftLowerArm.position.set(0, -0.35, 0);
    leftUpperArm.add(leftLowerArm);

    const rightUpperArm = createLimb(0.35, 0.11, skinMat);
    rightUpperArm.position.set(0.35, 0.6, 0);
    torso.add(rightUpperArm);

    const rightLowerArm = createLimb(0.35, 0.09, skinMat);
    rightLowerArm.position.set(0, -0.35, 0);
    rightUpperArm.add(rightLowerArm);

    // 下半身グループ (腰・脚)
    const hips = new THREE.Group();
    hips.position.set(0, 0.95, 0);
    body.add(hips);

    const leftUpperLeg = createLimb(0.48, 0.15, shortsMat);
    leftUpperLeg.position.set(-0.16, 0, 0);
    hips.add(leftUpperLeg);

    const leftLowerLeg = createLimb(0.48, 0.11, skinMat);
    leftLowerLeg.position.set(0, -0.48, 0);
    leftUpperLeg.add(leftLowerLeg);

    const rightUpperLeg = createLimb(0.48, 0.15, shortsMat);
    rightUpperLeg.position.set(0.16, 0, 0);
    hips.add(rightUpperLeg);

    const rightLowerLeg = createLimb(0.48, 0.11, skinMat);
    rightLowerLeg.position.set(0, -0.48, 0);
    rightUpperLeg.add(rightLowerLeg);

    characterRef.current = {
      root,
      body,
      torso,
      chestMesh,
      abdomenMesh,
      head,
      leftUpperArm,
      leftLowerArm,
      rightUpperArm,
      rightLowerArm,
      hips,
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

    // 9. メインレンダーループ
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // レップアニメーション進行 (0 -> 1 -> 0)
      if (isAnimatingRef.current) {
        animProgressRef.current += 0.07;
        if (animProgressRef.current >= 1) {
          animProgressRef.current = 1;
          isAnimatingRef.current = false;
        }
      } else if (animProgressRef.current > 0) {
        animProgressRef.current = Math.max(0, animProgressRef.current - 0.05);
      }

      const p = Math.sin(animProgressRef.current * Math.PI);

      // 最新の種目IDでポーズ更新
      updateExercisePose(currentExerciseRef.current.id, p);

      // パンプモードのオーラ発光
      if (characterRef.current) {
        if (isPumpMode) {
          characterRef.current.auraLight.intensity = 3.5 + Math.sin(Date.now() * 0.01) * 1.5;
        } else {
          characterRef.current.auraLight.intensity = 0;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // リサイズハンドラ
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth || 600;
      const newHeight = container.clientHeight || 500;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 筋肉量・ステータスによる3Dメッシュのビルドアップ（パンプ＆肥大化）
  useEffect(() => {
    if (!characterRef.current) return;
    const { chestMesh, abdomenMesh, leftUpperArm, rightUpperArm, leftUpperLeg, rightUpperLeg } =
      characterRef.current;

    const chestScale = 1.0 + Math.min(0.7, (muscleStats.chest - 10) * 0.006);
    chestMesh.scale.set(chestScale, 1.0 + (chestScale - 1) * 0.25, chestScale);

    const coreScale = 1.0 + Math.min(0.4, (muscleStats.core - 10) * 0.004);
    abdomenMesh.scale.set(coreScale, 1.0, coreScale);

    const armScale = 1.0 + Math.min(0.75, (muscleStats.arms - 10) * 0.007);
    leftUpperArm.scale.set(armScale, 1.0, armScale);
    rightUpperArm.scale.set(armScale, 1.0, armScale);

    const legScale = 1.0 + Math.min(0.65, (muscleStats.legs - 10) * 0.005);
    leftUpperLeg.scale.set(legScale, 1.0, legScale);
    rightUpperLeg.scale.set(legScale, 1.0, legScale);
  }, [muscleStats]);

  // 全18種目に対応した安全なポーズ更新（階層ピボット制御）
  const updateExercisePose = (exerciseId: string, p: number) => {
    if (!characterRef.current) return;
    const c = characterRef.current;

    // 器具を非表示にしてリセット
    c.bench.visible = false;
    c.barbell.visible = false;
    c.dumbbells.visible = false;
    c.pullupBar.visible = false;

    // 基本姿勢のリセット (毎回必ず安全にゼロリセット)
    c.root.position.set(0, 0, 0);
    c.root.rotation.set(0, 0, 0);
    c.body.position.set(0, 0, 0);
    c.body.rotation.set(0, 0, 0);
    c.torso.position.set(0, 0.95, 0);
    c.torso.rotation.set(0, 0, 0);
    c.hips.position.set(0, 0.95, 0);
    c.hips.rotation.set(0, 0, 0);

    c.leftUpperArm.rotation.set(0, 0, -0.2);
    c.leftLowerArm.rotation.set(0, 0, 0);
    c.rightUpperArm.rotation.set(0, 0, 0.2);
    c.rightLowerArm.rotation.set(0, 0, 0);

    c.leftUpperLeg.rotation.set(0, 0, 0);
    c.leftLowerLeg.rotation.set(0, 0, 0);
    c.rightUpperLeg.rotation.set(0, 0, 0);
    c.rightLowerLeg.rotation.set(0, 0, 0);

    if (exerciseId === 'pushup' || exerciseId === 'plank') {
      // --- 腕立て伏せ / プランク (床でうつ伏せ水平) ---
      const dip = exerciseId === 'pushup' ? p * 0.2 : 0;
      c.body.position.set(0, 0.32 - dip, -0.4);
      c.body.rotation.x = Math.PI / 2; // うつ伏せ

      c.leftUpperArm.rotation.set(-0.2 - dip * 2, 0, -0.6);
      c.leftLowerArm.rotation.set(-1.2 + dip * 2, 0, 0);
      c.rightUpperArm.rotation.set(-0.2 - dip * 2, 0, 0.6);
      c.rightLowerArm.rotation.set(-1.2 + dip * 2, 0, 0);

      c.leftUpperLeg.rotation.set(0, 0, 0);
      c.leftLowerLeg.rotation.set(0, 0, 0);
      c.rightUpperLeg.rotation.set(0, 0, 0);
      c.rightLowerLeg.rotation.set(0, 0, 0);
    } else if (exerciseId === 'crunch' || exerciseId === 'dragon_flag') {
      // --- クランチ / ドラゴンフラッグ (仰向けで上体または下肢を起こす) ---
      c.body.position.set(0, 0.2, 0);
      c.body.rotation.x = -Math.PI / 2; // 仰向け

      if (exerciseId === 'crunch') {
        c.torso.rotation.x = p * 0.5; // 上体を丸める
        c.leftUpperLeg.rotation.set(-Math.PI / 4, 0, 0);
        c.leftLowerLeg.rotation.set(Math.PI / 2.5, 0, 0);
        c.rightUpperLeg.rotation.set(-Math.PI / 4, 0, 0);
        c.rightLowerLeg.rotation.set(Math.PI / 2.5, 0, 0);
      } else {
        // ドラゴンフラッグ (下半身を棒にして持ち上げる)
        c.hips.rotation.x = p * 0.9;
      }

      c.leftUpperArm.rotation.set(0, 0, -0.5);
      c.leftLowerArm.rotation.set(-1.2, 0, 0);
      c.rightUpperArm.rotation.set(0, 0, 0.5);
      c.rightLowerArm.rotation.set(-1.2, 0, 0);
    } else if (
      exerciseId === 'airsquat' ||
      exerciseId === 'barbell_squat' ||
      exerciseId === 'bulgarian_squat'
    ) {
      // --- スクワット系 (深くしゃがみ込む) ---
      const isBarbell = exerciseId === 'barbell_squat';
      if (isBarbell) c.barbell.visible = true;

      const squatDepth = p * 0.45;
      c.body.position.y = -squatDepth;
      c.torso.rotation.x = p * 0.25;

      c.leftUpperLeg.rotation.set(-p * 1.3, 0, 0);
      c.leftLowerLeg.rotation.set(p * 1.3, 0, 0);
      c.rightUpperLeg.rotation.set(-p * 1.3, 0, 0);
      c.rightLowerLeg.rotation.set(p * 1.3, 0, 0);

      if (isBarbell) {
        c.barbell.position.set(0, 1.48 - squatDepth, 0);
        c.leftUpperArm.rotation.set(0, 0, -1.2);
        c.leftLowerArm.rotation.set(-1.5, 0, 0);
        c.rightUpperArm.rotation.set(0, 0, 1.2);
        c.rightLowerArm.rotation.set(-1.5, 0, 0);
      } else {
        // 前方に腕を伸ばす
        c.leftUpperArm.rotation.set(Math.PI / 2, 0, 0);
        c.rightUpperArm.rotation.set(Math.PI / 2, 0, 0);
      }
    } else if (exerciseId === 'bench_press') {
      // --- ベンチプレス (ベンチ台に横たわりバーベル挙上) ---
      c.bench.visible = true;
      c.barbell.visible = true;

      c.body.position.set(0, 0.55, 0);
      c.body.rotation.x = -Math.PI / 2; // 仰向け

      // バーベルの上下動
      const pressHeight = 0.8 + (1 - p) * 0.45;
      c.barbell.position.set(0, pressHeight, 0.1);

      c.leftUpperArm.rotation.set(0, 0, -0.6 + p * 0.7);
      c.leftLowerArm.rotation.set(0, 0, 0);
      c.rightUpperArm.rotation.set(0, 0, 0.6 - p * 0.7);
      c.rightLowerArm.rotation.set(0, 0, 0);

      c.leftUpperLeg.rotation.set(0.4, 0, -0.4);
      c.leftLowerLeg.rotation.set(0.5, 0, 0);
      c.rightUpperLeg.rotation.set(0.4, 0, 0.4);
      c.rightLowerLeg.rotation.set(0.5, 0, 0);
    } else if (exerciseId === 'deadlift') {
      // --- デッドリフト (床から引き上げる) ---
      c.barbell.visible = true;
      const lift = 1 - p;

      c.body.position.y = -lift * 0.2;
      c.torso.rotation.x = lift * 0.6; // 前傾

      const barY = 0.25 + (1 - lift) * 0.55;
      c.barbell.position.set(0, barY, 0.35);

      c.leftUpperArm.rotation.set(lift * 0.4, 0, 0);
      c.rightUpperArm.rotation.set(lift * 0.4, 0, 0);

      c.leftUpperLeg.rotation.set(-lift * 0.5, 0, 0);
      c.rightUpperLeg.rotation.set(-lift * 0.5, 0, 0);
    } else if (exerciseId === 'db_curl') {
      // --- ダンベルアームカール (力こぶを巻き上げる) ---
      c.dumbbells.visible = true;
      const curl = p * 2.2;

      c.leftUpperArm.rotation.set(0.1, 0, -0.15);
      c.leftLowerArm.rotation.set(-curl, 0, 0);
      c.rightUpperArm.rotation.set(0.1, 0, 0.15);
      c.rightLowerArm.rotation.set(-curl, 0, 0);

      c.dumbbells.position.set(0, 0.75 + p * 0.4, p * 0.22);
    } else if (exerciseId === 'pullup' || exerciseId === 'inverted_row') {
      // --- 懸垂 / 斜め懸垂 (ぶら下がって引き上げる) ---
      c.pullupBar.visible = true;
      const pull = p * 0.45;
      c.body.position.set(0, 0.15 + pull, 0);

      c.leftUpperArm.rotation.set(0, 0, -1.8 + p * 0.8);
      c.leftLowerArm.rotation.set(-0.8 + p * 0.8, 0, 0);
      c.rightUpperArm.rotation.set(0, 0, 1.8 - p * 0.8);
      c.rightLowerArm.rotation.set(-0.8 + p * 0.8, 0, 0);

      // 脚を少しクロス
      c.leftUpperLeg.rotation.set(0.3, 0, 0);
      c.leftLowerLeg.rotation.set(0.6, 0, 0);
      c.rightUpperLeg.rotation.set(0.3, 0, 0);
      c.rightLowerLeg.rotation.set(0.6, 0, 0);
    } else if (exerciseId === 'overhead_press') {
      // --- OHP (バーベル頭上プレス) ---
      c.barbell.visible = true;
      const pressY = 1.45 + p * 0.65;
      c.barbell.position.set(0, pressY, 0.05);

      c.leftUpperArm.rotation.set(0, 0, -0.8 - p * 0.8);
      c.rightUpperArm.rotation.set(0, 0, 0.8 + p * 0.8);
    } else if (exerciseId === 'dips') {
      // --- ディップス ---
      const dipY = p * 0.3;
      c.body.position.y = 0.2 - dipY;
      c.leftUpperArm.rotation.set(-dipY * 2, 0, -0.5);
      c.rightUpperArm.rotation.set(-dipY * 2, 0, 0.5);
    } else {
      // デフォルト待機ポーズ
      c.leftUpperArm.rotation.set(0, 0, -0.2);
      c.rightUpperArm.rotation.set(0, 0, 0.2);
    }
  };

  // 視点プリセット切り替え
  const setPreset = (view: 'diagonal' | 'front' | 'side') => {
    setActiveView(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (view === 'front') {
      camera.position.set(0, 1.6, 4.2);
      controls.target.set(0, 1.05, 0);
    } else if (view === 'side') {
      camera.position.set(4.2, 1.6, 0);
      controls.target.set(0, 1.05, 0);
    } else {
      camera.position.set(2.5, 2.2, 4.0);
      controls.target.set(0, 1.05, 0);
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 select-none">
      {/* 3D キャンバス */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* カメラアングル切り替えボタン */}
      <div className="absolute top-4 right-4 flex bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-800 text-xs shadow-xl">
        <button
          onClick={() => setPreset('diagonal')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeView === 'diagonal'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          斜め (3D)
        </button>
        <button
          onClick={() => setPreset('front')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeView === 'front'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          正面
        </button>
        <button
          onClick={() => setPreset('side')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeView === 'side'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          真横
        </button>
      </div>

      {/* ガイダンスチップ */}
      <div className="absolute top-4 left-4 bg-slate-900/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5 pointer-events-none shadow-lg">
        <span>🎮</span>
        <span>ドラッグで360°回転 / スクロールでズーム</span>
      </div>

      {/* トレーニング中バッジ */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
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
