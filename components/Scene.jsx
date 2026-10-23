"use client";
// Charge la scène 3D côté client uniquement (SSR désactivé), le contenu SEO reste rendu par le serveur
import dynamic from "next/dynamic";
const Experience = dynamic(() => import("./Experience"), { ssr: false });
export default function Scene(props) { return <Experience {...props} />; }
