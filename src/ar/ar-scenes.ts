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

  group.add(line([new THREE.Vector3(-0.92, -0.68, 0.01), new THREE.Vector3(0.92, -0.68, 0.01)], 0x7be08a));
  const dopplerSource = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  dopplerSource.position.set(0.25, -0.68, 0.07);
  group.add(dopplerSource);
  const dopplerWavefronts: THREE.Mesh[] = [];
  for (let i = 1; i <= 4; i++) {
    const radius = i * 0.13;
    const wavefront = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.008, radius + 0.008, 48),
      new THREE.MeshBasicMaterial({ color: 0x7be08a, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
    );
    wavefront.name = `doppler-wavefront-${i}`;
    wavefront.position.set(0.25 - i * 0.08, -0.68, 0.04);
    dopplerWavefronts.push(wavefront);
    group.add(wavefront);
  }
  const dopplerObserver = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 8), new THREE.MeshBasicMaterial({ color: 0xff9d7a }));
  dopplerObserver.name = "doppler-observer";
  dopplerObserver.position.set(0.82, -0.68, 0.07);
  group.add(dopplerObserver);

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
      dopplerSource.position.x = 0.25 + Math.sin(elapsedSeconds * 1.2) * 0.025;
      dopplerWavefronts.forEach((wavefront, i) => {
        (wavefront.material as THREE.MeshBasicMaterial).opacity = 0.58 + 0.22 * Math.sin(elapsedSeconds * 3 - i * 0.55) ** 2;
      });
    },
    dispose: () => disposeGroup(group),
  };
}

function createElectromagneticScene(): LessonArScene {
  const group = new THREE.Group();
  const radarStoryIcon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.14), new THREE.MeshBasicMaterial({ color: 0x6fd3ff }));
  radarStoryIcon.position.set(-0.72, 0.24, 0.08);
  const antennaStoryIcon = line([new THREE.Vector3(-0.7, -0.42, 0.06), new THREE.Vector3(-0.7, -0.05, 0.06)], 0xf2f4fb);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.12), new THREE.MeshBasicMaterial({ color: 0x29364f, transparent: true, opacity: 0.88 }));
  receiver.position.set(0.48, -0.02, 0.05);
  group.add(radarStoryIcon, antennaStoryIcon, receiver);

  const signalPaths = [
    line([radarStoryIcon.position.clone(), new THREE.Vector3(0.24, 0.12, 0.11)], 0xffd166),
    line([new THREE.Vector3(-0.7, -0.2, 0.06), new THREE.Vector3(0.24, -0.12, 0.11)], 0x6fd3ff),
  ];
  group.add(...signalPaths);

  const pulses = signalPaths.map((_, index) => {
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 14, 8),
      new THREE.MeshBasicMaterial({ color: index === 0 ? 0xffd166 : 0x6fd3ff })
    );
    group.add(pulse);
    return pulse;
  });

  const lcRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.025, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0x7be08a })
  );
  lcRing.position.set(0.48, -0.02, 0.14);
  group.add(lcRing);

  const resonancePeak = line(
    [
      new THREE.Vector3(0.25, -0.44, 0.06),
      new THREE.Vector3(0.38, -0.34, 0.06),
      new THREE.Vector3(0.48, -0.12, 0.06),
      new THREE.Vector3(0.58, -0.34, 0.06),
      new THREE.Vector3(0.71, -0.44, 0.06),
    ],
    0x7be08a
  );
  group.add(resonancePeak);

  return {
    group,
    update(elapsedSeconds) {
      const t = (elapsedSeconds * 0.48) % 1;
      pulses[0].position.lerpVectors(radarStoryIcon.position, new THREE.Vector3(0.24, 0.12, 0.11), t);
      pulses[1].position.lerpVectors(new THREE.Vector3(-0.7, -0.2, 0.06), new THREE.Vector3(0.24, -0.12, 0.11), t);
      pulses.forEach((pulse) => { pulse.position.z = 0.16; });
      lcRing.scale.setScalar(1 + 0.12 * Math.sin(elapsedSeconds * 5));
      signalPaths.forEach((path, index) => {
        (path.material as THREE.LineBasicMaterial).opacity = 0.5 + 0.35 * Math.sin(elapsedSeconds * 4 + index) ** 2;
      });
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
