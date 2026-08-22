import * as THREE from "three";

export interface LessonArScene {
  group: THREE.Group;
  update: (elapsedSeconds: number) => void;
  dispose: () => void;
}

function disposeGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
}

function line(points: THREE.Vector3[], color: number) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
  );
}

function createWaveScene(): LessonArScene {
  const group = new THREE.Group();
  const cyan = new THREE.MeshBasicMaterial({ color: 0x6fd3ff, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  const barrier = new THREE.MeshBasicMaterial({ color: 0xf2f4fb });
  const source = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  source.position.set(-0.72, 0, 0.08);
  group.add(source);

  for (const y of [-0.46, 0.46]) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), barrier.clone());
    block.position.set(0, y, 0.04);
    group.add(block);
  }

  const incomingRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.135, 48), cyan.clone());
    ring.position.set(-0.72, 0, 0.025);
    incomingRings.push(ring);
    group.add(ring);
  }

  const diffractedArcs: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.155, 48, 1, -Math.PI / 2, Math.PI), cyan.clone());
    arc.position.set(0.02, 0, 0.03);
    diffractedArcs.push(arc);
    group.add(arc);
  }

  group.add(line([new THREE.Vector3(-0.92, -0.62, 0.01), new THREE.Vector3(0.92, -0.62, 0.01)], 0x7be08a));
  const dopplerSource = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  dopplerSource.position.set(0, -0.68, 0.07);
  group.add(dopplerSource);
  for (const x of [0.16, 0.3, 0.43, 0.55, -0.2, -0.42, -0.66]) {
    group.add(line([new THREE.Vector3(x, -0.78, 0.04), new THREE.Vector3(x, -0.58, 0.04)], 0x7be08a));
  }

  return {
    group,
    update(elapsedSeconds) {
      incomingRings.forEach((ring, i) => {
        const scale = 0.8 + ((elapsedSeconds * 0.75 + i / 3) % 1) * 3.6;
        ring.scale.setScalar(scale);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0.12, 0.9 - scale * 0.2);
      });
      diffractedArcs.forEach((arc, i) => {
        const scale = 0.9 + ((elapsedSeconds * 0.62 + i / 3) % 1) * 3.8;
        arc.scale.setScalar(scale);
        (arc.material as THREE.MeshBasicMaterial).opacity = Math.max(0.12, 0.9 - scale * 0.2);
      });
      source.scale.setScalar(1 + Math.sin(elapsedSeconds * 6) * 0.15);
      dopplerSource.position.x = Math.sin(elapsedSeconds * 1.2) * 0.04;
    },
    dispose: () => disposeGroup(group),
  };
}

function createElectromagneticScene(): LessonArScene {
  const group = new THREE.Group();
  const station = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.16), new THREE.MeshBasicMaterial({ color: 0x6fd3ff }));
  station.position.set(-0.68, -0.08, 0.08);
  const target = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 4), new THREE.MeshBasicMaterial({ color: 0xff9d7a }));
  target.rotation.z = Math.PI / 4;
  target.position.set(0.68, 0.22, 0.08);
  group.add(station, target);

  const beam = line([station.position.clone(), target.position.clone()], 0xffd166);
  group.add(beam);
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  group.add(pulse);

  const yagiBoom = line([new THREE.Vector3(-0.55, -0.45, 0.06), new THREE.Vector3(0.05, -0.18, 0.06)], 0xf2f4fb);
  group.add(yagiBoom);
  for (let i = 0; i < 5; i++) {
    const x = -0.48 + i * 0.13;
    group.add(line([new THREE.Vector3(x, -0.53 + i * 0.058, 0.06), new THREE.Vector3(x - 0.08, -0.20 + i * 0.058, 0.06)], 0xf2f4fb));
  }

  const lcRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.025, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0x7be08a })
  );
  lcRing.position.set(0.55, -0.43, 0.05);
  group.add(lcRing);

  return {
    group,
    update(elapsedSeconds) {
      const cycle = (elapsedSeconds * 0.42) % 2;
      const t = cycle <= 1 ? cycle : 2 - cycle;
      pulse.position.lerpVectors(station.position, target.position, t);
      pulse.position.z = 0.16;
      lcRing.scale.setScalar(1 + 0.12 * Math.sin(elapsedSeconds * 5));
      (beam.material as THREE.LineBasicMaterial).opacity = 0.55 + 0.35 * Math.sin(elapsedSeconds * 4) ** 2;
    },
    dispose: () => disposeGroup(group),
  };
}

function createQuantumScene(): LessonArScene {
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), new THREE.MeshBasicMaterial({ color: 0xb8c0e0 }));
  plate.position.set(-0.12, 0, 0.04);
  group.add(plate);

  const photon = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  const electron = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10), new THREE.MeshBasicMaterial({ color: 0x6fd3ff }));
  group.add(photon, electron);

  const pointGeometry = new THREE.SphereGeometry(0.018, 8, 6);
  const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x7be08a, transparent: true, opacity: 0.75 });
  const cloudPoints: THREE.Mesh[] = [];
  for (let i = 0; i < 32; i++) {
    const point = new THREE.Mesh(pointGeometry.clone(), pointMaterial.clone());
    const angle = i * 2.39996;
    const radius = 0.08 + 0.045 * Math.sqrt(i);
    point.position.set(0.45 + Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, 0.04 + (i % 3) * 0.012);
    cloudPoints.push(point);
    group.add(point);
  }

  return {
    group,
    update(elapsedSeconds) {
      const cycle = elapsedSeconds % 2.8;
      const photonT = Math.min(1, cycle / 1.1);
      photon.position.set(-0.9 + photonT * 0.78, 0.28, 0.12);
      const electronT = Math.max(0, Math.min(1, (cycle - 1.1) / 1.2));
      electron.position.set(-0.05 + electronT * 0.72, 0.12 + electronT * 0.38, 0.12);
      electron.visible = cycle >= 1.05;
      cloudPoints.forEach((point, i) => {
        const pulse = 0.72 + 0.28 * Math.sin(elapsedSeconds * 2.5 + i * 0.7);
        point.scale.setScalar(pulse);
      });
    },
    dispose: () => disposeGroup(group),
  };
}

export function createLessonArScene(targetIndex: number): LessonArScene {
  if (targetIndex === 0) return createWaveScene();
  if (targetIndex === 1) return createElectromagneticScene();
  return createQuantumScene();
}
