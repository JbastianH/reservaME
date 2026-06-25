"use client";

import { motion } from "framer-motion";

type Direction = "up" | "down" | "left" | "right";

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: Direction;
};

function getInitialPosition(direction: Direction) {
  switch (direction) {
    case "left":
      return { x: -60, y: 0 };
    case "right":
      return { x: 60, y: 0 };
    case "down":
      return { x: 0, y: -36 };
    case "up":
    default:
      return { x: 0, y: 36 };
  }
}

export default function Reveal({
  children,
  delay = 0,
  className,
  direction = "up",
}: Props) {
  const initialPosition = getInitialPosition(direction);

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        x: initialPosition.x,
        y: initialPosition.y,
        filter: "blur(8px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}