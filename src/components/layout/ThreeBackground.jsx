import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Floating particles
    const particleCount = 280;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      sizes[i] = Math.random() * 1.5 + 0.5;
      opacities[i] = Math.random() * 0.6 + 0.1;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0xd4a520,
      size: 0.18,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Floating geometric meshes
    const meshes = [];
    const geometries = [
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.TetrahedronGeometry(1.0, 0),
      new THREE.IcosahedronGeometry(1.0, 0),
      new THREE.OctahedronGeometry(0.8, 0),
      new THREE.TetrahedronGeometry(0.7, 0),
      new THREE.IcosahedronGeometry(0.9, 0),
      new THREE.OctahedronGeometry(1.5, 0),
    ];

    geometries.forEach((geo, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xd4a520,
        wireframe: true,
        transparent: true,
        opacity: 0.06 + (i % 3) * 0.03,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData = {
        speedX: (Math.random() - 0.5) * 0.004,
        speedY: (Math.random() - 0.5) * 0.003,
        floatSpeed: Math.random() * 0.002 + 0.001,
        floatOffset: Math.random() * Math.PI * 2,
      };
      scene.add(mesh);
      meshes.push(mesh);
    });

    // Connecting lines (constellation effect)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xd4a520,
      transparent: true,
      opacity: 0.04,
    });
    const linePositions = [];
    for (let i = 0; i < 18; i++) {
      const x1 = (Math.random() - 0.5) * 70;
      const y1 = (Math.random() - 0.5) * 50;
      const z1 = (Math.random() - 0.5) * 30;
      const x2 = x1 + (Math.random() - 0.5) * 20;
      const y2 = y1 + (Math.random() - 0.5) * 15;
      const z2 = z1 + (Math.random() - 0.5) * 10;
      linePositions.push(x1, y1, z1, x2, y2, z2);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Mouse parallax
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Animation
    let frame = 0;
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      frame += 0.01;

      // Slow particle drift
      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.0002;

      // Mesh float and rotate
      meshes.forEach((mesh) => {
        const { speedX, speedY, floatSpeed, floatOffset } = mesh.userData;
        mesh.rotation.x += speedX;
        mesh.rotation.y += speedY;
        mesh.position.y += Math.sin(frame + floatOffset) * floatSpeed;
      });

      // Lines slow rotation
      lines.rotation.y += 0.0003;

      // Camera parallax
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      particleGeo.dispose();
      particleMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      geometries.forEach((geo) => geo.dispose());
      meshes.forEach((mesh) => mesh.material.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}