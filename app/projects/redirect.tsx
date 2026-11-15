"use client";

import { useEffect } from "react";

export function ProjectsRedirect() {
  useEffect(() => {
    window.location.replace("/strategies/" + window.location.search + window.location.hash);
  }, []);
  return null;
}
