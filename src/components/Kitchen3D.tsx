/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { type Chef, type RestaurantCustomization, type Recipe, type Ingredient, sounds } from "../types";

interface Kitchen3DProps {
  chefs: Chef[];
  activeStation: "stove" | "cutting" | "assembly" | "lobby" | "idle";
  activeRecipe: Recipe | null;
  activeIngredient: Ingredient | null;
  customization: RestaurantCustomization;
  isStoveOn: boolean;
  stoveLevel: number;
  onStationClick: (station: "stove" | "cutting" | "assembly" | "lobby") => void;
}

export default function Kitchen3D({
  chefs,
  activeStation,
  activeRecipe,
  activeIngredient,
  customization,
  isStoveOn,
  stoveLevel,
  onStationClick,
}: Kitchen3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References to communicate state to Three.js loop without re-instantiating the whole scene
  const stateRef = useRef({
    chefs,
    activeStation,
    activeRecipe,
    activeIngredient,
    customization,
    isStoveOn,
    stoveLevel,
  });

  useEffect(() => {
    stateRef.current = {
      chefs,
      activeStation,
      activeRecipe,
      activeIngredient,
      customization,
      isStoveOn,
      stoveLevel,
    };
  }, [chefs, activeStation, activeRecipe, activeIngredient, customization, isStoveOn, stoveLevel]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = 400;

    // --- SCENE & CAMERA SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#fbf6f3"); // Lovely soft warm light pastel cream background

    // Elegantly positioned perspective camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Initial high-angle cinematic isometric position
    camera.position.set(6, 6, 8);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xfff0eb, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Warm soft window light
    const pointLight = new THREE.PointLight(0xffe4e6, 0.6, 15);
    pointLight.position.set(-4, 3, -2);
    scene.add(pointLight);

    // Dynamic colorized accent light for restaurant customization
    const accentLight = new THREE.PointLight(new THREE.Color(customization.lightingColor), 0.5, 10);
    accentLight.position.set(2, 4, 3);
    scene.add(accentLight);

    // --- MATERIALS LOBBY ---
    const pastelPinkMat = new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.2 });
    const pastelMintMat = new THREE.MeshStandardMaterial({ color: 0xd1fae5, roughness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.5 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.1 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.6, roughness: 0.3 });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 });

    // --- OBJECT GENERATION FUNCTIONS ---

    // Floor & Walls Grid
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const floorGeo = new THREE.BoxGeometry(12, 0.2, 12);
    const floorMesh = new THREE.Mesh(floorGeo, woodMat);
    floorMesh.position.y = -0.1;
    floorMesh.receiveShadow = true;
    roomGroup.add(floorMesh);

    // Backdrop walls
    const wallGeoY = new THREE.BoxGeometry(0.2, 5, 12);
    const backWall = new THREE.Mesh(wallGeoY, new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
    backWall.position.set(-6, 2.4, 0);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.2), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
    leftWall.position.set(0, 2.4, -6);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Elegant Window frame in left wall
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 2.8, -5.85);
    const winGeo = new THREE.BoxGeometry(3, 2, 0.1);
    const winMesh = new THREE.Mesh(winGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
    const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 0.12), new THREE.MeshBasicMaterial({ color: 0xdbeafe, opacity: 0.7, transparent: true }));
    windowGroup.add(winMesh, glassMesh);
    roomGroup.add(windowGroup);

    // --- STATIONS SETUP ---

    // 1. Kitchen Main Island (Center Counter)
    const islandGroup = new THREE.Group();
    islandGroup.position.set(-1.5, 0.5, -1);
    scene.add(islandGroup);

    // Counter body
    const counterBody = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 2.2), pastelPinkMat);
    counterBody.castShadow = true;
    counterBody.receiveShadow = true;
    islandGroup.add(counterBody);

    // Counter marble top
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 2.4), marbleMat);
    counterTop.position.y = 0.55;
    islandGroup.add(counterTop);

    // Stove Area (Left part of island)
    const stoveCenter = new THREE.Vector3(-1.4, 0.6, 0);
    const stoveMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.02, 16), ironMat);
    stoveMesh.position.copy(stoveCenter);
    islandGroup.add(stoveMesh);

    const heatingCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.03, 16), new THREE.MeshBasicMaterial({ color: 0x374151 }));
    heatingCoil.position.copy(stoveCenter).add(new THREE.Vector3(0, 0.015, 0));
    islandGroup.add(heatingCoil);

    // Cooking pan
    const panGroup = new THREE.Group();
    panGroup.position.copy(stoveCenter).add(new THREE.Vector3(0, 0.1, 0));
    const panBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.15, 16), ironMat);
    const panHandle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.1), ironMat);
    panHandle.position.set(0.6, 0.05, 0);
    panGroup.add(panBase, panHandle);
    islandGroup.add(panGroup);

    // 2. Cutting Board Area (Right part of island)
    const cuttingCenter = new THREE.Vector3(1.3, 0.6, 0);
    const cuttingBoard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.0), woodMat);
    cuttingBoard.position.copy(cuttingCenter);
    islandGroup.add(cuttingBoard);

    // Slicing knife sitting on board
    const knifeGroup = new THREE.Group();
    knifeGroup.position.copy(cuttingCenter).add(new THREE.Vector3(0, 0.12, 0.2));
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.01), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9 }));
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), woodMat);
    handle.position.x = -0.3;
    knifeGroup.add(blade, handle);
    islandGroup.add(knifeGroup);

    // Raw ingredient displayed dynamically
    const ingredientMeshGroup = new THREE.Group();
    ingredientMeshGroup.position.copy(cuttingCenter).add(new THREE.Vector3(0, 0.14, -0.1));
    islandGroup.add(ingredientMeshGroup);

    // 3. Assembly Area (Right separate gold prep cabinet)
    const assemblyGroup = new THREE.Group();
    assemblyGroup.position.set(3, 0.5, -1);
    scene.add(assemblyGroup);

    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), pastelMintMat);
    cabinet.castShadow = true;
    assemblyGroup.add(cabinet);

    const cabinetTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 2.1), marbleMat);
    cabinetTop.position.y = 0.54;
    assemblyGroup.add(cabinetTop);

    const goldPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.04, 16), goldMat);
    goldPlate.position.set(0, 0.6, 0);
    assemblyGroup.add(goldPlate);

    // 4. Restaurant Space / Customer Cozy Corner (Foreground right)
    const cafeGroup = new THREE.Group();
    cafeGroup.position.set(2, 0.4, 2.5);
    scene.add(cafeGroup);

    const cafeTable = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 24), baseDecorMaterial(customization.flooring));
    cafeTable.position.y = 0.4;
    cafeTable.castShadow = true;
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), goldMat);
    tableLeg.position.y = 0;
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 12), ironMat);
    tableBase.position.y = -0.4;
    cafeGroup.add(cafeTable, tableLeg, tableBase);

    // Pastel chairs
    const chairBackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.06);
    const chairSeatGeo = new THREE.BoxGeometry(0.4, 0.05, 0.4);

    const makeChair = (colorHex: number, angle: number) => {
      const chair = new THREE.Group();
      const chairMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
      const seat = new THREE.Mesh(chairSeatGeo, chairMat);
      seat.position.y = -0.1;
      const tback = new THREE.Mesh(chairBackGeo, chairMat);
      tback.position.set(0, 0.1, -0.18);
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4), chairMat);
      leg1.position.set(-0.16, -0.25, -0.16);
      const leg2 = leg1.clone(); leg2.position.set(0.16, -0.25, -0.16);
      const leg3 = leg1.clone(); leg3.position.set(-0.16, -0.25, 0.16);
      const leg4 = leg1.clone(); leg4.position.set(0.16, -0.25, 0.16);
      chair.add(seat, tback, leg1, leg2, leg3, leg4);

      const rad = angle * (Math.PI / 180);
      chair.position.set(Math.cos(rad) * 1.3, -0.05, Math.sin(rad) * 1.3);
      chair.rotation.y = -rad + Math.PI / 2;
      return chair;
    };

    const leftChair = makeChair(0xffadb9, 135); // Soft Rose Gold Chair
    const rightChair = makeChair(0xbfdbfe, -45); // Mint Indigo Chair
    cafeGroup.add(leftChair, rightChair);

    // Elegant Centerpiece
    const centerpieceGroup = new THREE.Group();
    centerpieceGroup.position.set(0, 0.45, 0);
    cafeGroup.add(centerpieceGroup);

    // --- STEAM PARTICLES FOR STOVE ---
    const steamCount = 8;
    const steamGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
    });
    const steamParticles: THREE.Mesh[] = [];
    for (let i = 0; i < steamCount; i++) {
      const steam = new THREE.Mesh(steamGeo, steamMat);
      // Spawn within pan area
      resetSteam(steam);
      scene.add(steam);
      steamParticles.push(steam);
    }

    function resetSteam(mesh: THREE.Mesh) {
      mesh.position.set(
        -1.5 + (Math.random() - 0.5) * 0.4,
        1.2,
        -1 + (Math.random() - 0.5) * 0.4
      );
      mesh.scale.set(1, 1, 1);
    }

    // --- MULTIPLAYER CHEF AVATARS ---
    const chefMeshes: { [id: string]: THREE.Group } = {};

    function updateChefs(chefList: Chef[]) {
      // Remove old meshes
      Object.keys(chefMeshes).forEach((id) => {
        if (!chefList.find((c) => c.id === id)) {
          scene.remove(chefMeshes[id]);
          delete chefMeshes[id];
        }
      });

      // Add or update existing
      chefList.forEach((chef) => {
        let group = chefMeshes[chef.id];
        if (!group) {
          group = new THREE.Group();

          // Body (Pastel uniform)
          const bodyMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(chef.color),
            roughness: 0.3,
          });
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.7, 16), bodyMat);
          body.position.y = 0.35;
          body.castShadow = true;
          group.add(body);

          // Head (Skin tone)
          const faceMat = new THREE.MeshStandardMaterial({ color: 0xffe5d9, roughness: 0.5 });
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), faceMat);
          head.position.y = 0.8;
          head.castShadow = true;
          group.add(head);

          // Chef Hat! (Classic tall puffy hat)
          const hatGroup = new THREE.Group();
          hatGroup.position.y = 1.05;
          const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.15, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
          const hatPuff = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
          hatPuff.position.y = 0.15;
          hatPuff.scale.y = 0.7;
          hatPuff.castShadow = true;
          hatGroup.add(hatBase, hatPuff);
          group.add(hatGroup);

          // Cute pink cheeks for girls/aesthetic look
          const cheekGeo = new THREE.SphereGeometry(0.03, 4, 4);
          const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff85a1 });
          const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
          cheekL.position.set(0.1, 0.78, 0.16);
          const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
          cheekR.position.set(-0.1, 0.78, 0.16);
          group.add(cheekL, cheekR);

          group.position.set(chef.position.x, chef.position.y, chef.position.z);
          scene.add(group);
          chefMeshes[chef.id] = group;
        }

        // Bob up and down if chopping/cooking
        if (chef.activeStation === "cutting" || chef.activeStation === "stove") {
          const osc = Math.sin(Date.now() * 0.015) * 0.05;
          group.position.y = chef.position.y + osc;
        } else {
          group.position.y = THREE.MathUtils.lerp(group.position.y, chef.position.y, 0.1);
        }
      });
    }

    // Helper to map flooring type to a base material color or texture
    function baseDecorMaterial(flooring: "mintCheckered" | "pinkMarble" | "pastelOak") {
      switch (flooring) {
        case "mintCheckered":
          return new THREE.MeshStandardMaterial({ color: 0xbbf7d0, roughness: 0.3 }); // Mint
        case "pinkMarble":
          return new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.1 }); // Rose
        case "pastelOak":
          return new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 }); // Oak/Peach
      }
    }

    // Dynamic interior updater (Wall color, flooring, tabletop ornaments)
    function updateDecorations(decor: RestaurantCustomization) {
      // 1. Flooring visual
      if (decor.flooring === "mintCheckered") {
        floorMesh.material = new THREE.MeshStandardMaterial({ color: 0xe6fbf0, roughness: 0.3 });
      } else if (decor.flooring === "pinkMarble") {
        floorMesh.material = new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.1 });
      } else {
        floorMesh.material = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
      }

      // 2. Accent Light
      accentLight.color.set(decor.lightingColor);

      // 3. Wall painting (represented by color matching chosen wallpaper)
      let wColor = 0xfef3c7;
      if (decor.wallpaper === "flowerGarden") wColor = 0xffe4e6;
      else if (decor.wallpaper === "auroraWave") wColor = 0xf5f3ff;
      else if (decor.wallpaper === "goldRibbon") wColor = 0xfff7ed;
      else wColor = 0xfdf8f5;

      (backWall.material as THREE.MeshStandardMaterial).color.setHex(wColor);
      (leftWall.material as THREE.MeshStandardMaterial).color.setHex(wColor);

      // 4. Centerpiece generator
      // Clear old centerpiece
      while (centerpieceGroup.children.length > 0) {
        centerpieceGroup.remove(centerpieceGroup.children[0]);
      }

      // Pot/Vase bottom
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.22, 12), goldMat);
      pot.position.y = 0.1;
      centerpieceGroup.add(pot);

      if (decor.centerpiece === "pottedTulips") {
        // Red spring pink tulips
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), stemMat);
        stem.position.y = 0.25;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff85a1 }));
        petal.scale.y = 1.4;
        petal.position.set(0, 0.4, 0);
        centerpieceGroup.add(stem, petal);
      } else if (decor.centerpiece === "lavenderVase") {
        // Lavender branches
        for (let i = 0; i < 3; i++) {
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 6), stemMat);
          stem.position.set((i - 1) * 0.06, 0.26, 0);
          stem.rotation.z = (i - 1) * 0.15;
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd8b4fe }));
          leaf.position.y = 0.2;
          stem.add(leaf);
          centerpieceGroup.add(stem);
        }
      } else if (decor.centerpiece === "pinkRoses") {
        // Pink rose flower
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), stemMat);
        stem.position.y = 0.22;
        const flower = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.04, 8, 16), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
        flower.position.set(0, 0.32, 0);
        centerpieceGroup.add(stem, flower);
      } else {
        // Scented candle
        const candleCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
        candleCoil.position.y = 0.1;
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        flame.position.set(0, 0.22, 0);
        centerpieceGroup.add(candleCoil, flame);
      }
    }

    // Dynamic Ingredient model builder for active slicing station
    let lastIngredientId = "";
    function generateFoodMesh(ingredient: Ingredient | null) {
      if (!ingredient) {
        while (ingredientMeshGroup.children.length > 0) {
          ingredientMeshGroup.remove(ingredientMeshGroup.children[0]);
        }
        lastIngredientId = "";
        return;
      }

      if (ingredient.id === lastIngredientId) {
        // Animate based on sliced count
        if (ingredientMeshGroup.children.length > 0) {
          const sliceProg = ingredient.slicedCount / ingredient.maxSlices;
          ingredientMeshGroup.children.forEach((child, index) => {
            // Sliced parts drift away
            if (index > 0 && sliceProg > 0) {
              child.position.x = THREE.MathUtils.lerp(child.position.x, index * 0.18 + (sliceProg * 0.1), 0.1);
              child.rotation.z = THREE.MathUtils.lerp(child.rotation.z, (index - 0.5) * 0.6, 0.1);
            }
          });
        }
        return;
      }

      lastIngredientId = ingredient.id;
      while (ingredientMeshGroup.children.length > 0) {
        ingredientMeshGroup.remove(ingredientMeshGroup.children[0]);
      }

      // Create beautiful model representation
      const colorNum = new THREE.Color(ingredient.color).getHex();
      const foodMat = new THREE.MeshStandardMaterial({ color: colorNum, roughness: 0.4 });

      if (ingredient.name.includes("Strawberry")) {
        // Conical strawberry halves
        const strawGeo = new THREE.ConeGeometry(0.18, 0.35, 12);
        const m1 = new THREE.Mesh(strawGeo, foodMat);
        m1.position.set(-0.1, 0.05, 0);
        m1.castShadow = true;
        const m2 = new THREE.Mesh(strawGeo, foodMat);
        m2.position.set(0.1, 0.05, 0);
        m2.castShadow = true;
        ingredientMeshGroup.add(m1, m2);
      } else if (ingredient.isLiquid) {
        // Cream or Batter bowl
        const bowlGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.18, 16);
        const bowl = new THREE.Mesh(bowlGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 }));
        const coreLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12), foodMat);
        coreLiquid.position.y = 0.081;
        ingredientMeshGroup.add(bowl, coreLiquid);
      } else if (ingredient.name.includes("Blueberry")) {
        // Multiple small berry spheres
        for (let i = 0; i < 3; i++) {
          const berry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), foodMat);
          berry.position.set((i - 1) * 0.16, 0.04, (Math.random() - 0.5) * 0.1);
          berry.castShadow = true;
          ingredientMeshGroup.add(berry);
        }
      } else if (ingredient.name.includes("Pasta") || ingredient.name.includes("Noodle")) {
        // Coiled yellow ring pasta
        const pastaRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), foodMat);
        pastaRing.rotation.x = Math.PI / 2;
        ingredientMeshGroup.add(pastaRing);
      } else {
        // Elegant generic double macaron/ingredient shell
        const sub1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), foodMat);
        sub1.scale.y = 0.5;
        sub1.position.y = 0.05;
        sub1.castShadow = true;
        ingredientMeshGroup.add(sub1);
      }
    }

    // --- CLICK EVENT RAYCASTING FOR INTERACTIVE HOTSPOTS ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onCanvasClick = (event: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check hits on counter spaces or tables
      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length > 0) {
        let clickedPath: string | null = null;
        for (const hit of hits) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr) {
            if (curr === islandGroup) {
              // Stove is left, chopping is right
              if (hit.point.x < -0.3) {
                clickedPath = "stove";
              } else {
                clickedPath = "cutting";
              }
              break;
            } else if (curr === assemblyGroup) {
              clickedPath = "assembly";
              break;
            } else if (curr === cafeGroup) {
              clickedPath = "lobby";
              break;
            }
            curr = curr.parent;
          }
          if (clickedPath) break;
        }

        if (clickedPath) {
          sounds.playPop();
          onStationClick(clickedPath as any);
        }
      }
    };

    canvasRef.current.addEventListener("click", onCanvasClick);

    // --- CAMERA SMOOTH POSITIONING FOR STATIONS ---
    const targetCamPos = new THREE.Vector3(6, 6, 8);
    const targetLookAt = new THREE.Vector3(0, 0.5, 0);

    function updateCameraTarget(station: string) {
      if (station === "stove") {
        targetCamPos.set(-2.4, 3.4, 2.8);
        targetLookAt.set(-1.6, 0.6, -1);
      } else if (station === "cutting") {
        targetCamPos.set(1.4, 3.4, 3.0);
        targetLookAt.set(1.1, 0.6, -1);
      } else if (station === "assembly") {
        targetCamPos.set(4.0, 3.4, 2.0);
        targetLookAt.set(3, 0.5, -1);
      } else if (station === "lobby") {
        targetCamPos.set(4.2, 3.8, 4.6);
        targetLookAt.set(2, 0.4, 2.5);
      } else {
        // High angle general cinematic overview
        targetCamPos.set(6, 6.2, 8.4);
        targetLookAt.set(0.5, 0.5, 0);
      }
    }

    // --- ANIMATION MASTER LOOP ---
    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const currState = stateRef.current;

      // Update chef positioning and animation frame lists
      updateChefs(currState.chefs);
      updateDecorations(currState.customization);
      generateFoodMesh(currState.activeIngredient);

      // Slicing animation bounce & rotate
      if (currState.activeStation === "cutting" && knifeGroup) {
        knifeGroup.position.y = 0.72 + Math.abs(Math.sin(Date.now() * 0.018)) * 0.15;
        knifeGroup.rotation.z = Math.sin(Date.now() * 0.015) * 0.15;
      } else if (knifeGroup) {
        knifeGroup.position.set(1.3, 0.72, 0.2);
        knifeGroup.rotation.set(0, 0, 0);
      }

      // Pan stir / sizzle float bounce
      if (currState.isStoveOn && currState.stoveLevel > 0) {
        panGroup.position.y = 0.7 + Math.sin(Date.now() * 0.05) * 0.012;
        // Animate steam particles upwards
        steamParticles.forEach((steam, idx) => {
          steam.visible = true;
          steam.position.y += delta * (0.8 + idx * 0.1);
          steam.scale.multiplyScalar(0.97);

          if (steam.position.y > 2.5) {
            resetSteam(steam);
          }
        });
      } else {
        panGroup.position.y = 0.7;
        steamParticles.forEach((steam) => {
          steam.visible = false;
        });
      }

      // Lerp camera to target focus states
      updateCameraTarget(currState.activeStation);

      camera.position.lerp(targetCamPos, 0.06);

      // Calculate lookAt vector dynamically
      const currentLookAt = new THREE.Vector3(0, 0.5, 0);
      currentLookAt.copy(camera.position).add(new THREE.Vector3(0, 0, -1)); // fallback
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
    };

    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("click", onCanvasClick);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="3d-kitchen-container"
      className="relative w-full h-[380px] md:h-[450px] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#fff1f2] bg-gradient-to-b from-[#fffaf7] to-[#fff3ed] touch-none"
    >
      {/* Dynamic Floating Labels */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <span className="px-3 py-1 bg-white/90 backdrop-blur-md border border-rose-100 rounded-full text-xs font-semibold text-rose-500 shadow-sm flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Live 3D Kitchen Stage
        </span>
        <button
          onClick={() => {
            sounds.enabled = !sounds.enabled;
            sounds.playPop();
          }}
          className="p-1 px-2.5 bg-white/90 backdrop-blur-md border border-rose-100 rounded-full text-xs font-semibold text-rose-500 hover:bg-rose-50 shadow-sm transition-all"
        >
          🔊 SFX Toggle
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-md rounded-full px-4 py-1.5 flex gap-4 text-xs font-medium text-slate-500 shadow-md border border-rose-100/40">
        <span className="flex items-center gap-1">🖱️ Click Station to Switch Focus</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />
    </div>
  );
}
