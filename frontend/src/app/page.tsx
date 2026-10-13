"use client";

import { useCallback, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import ProjectAI from "@/components/ProjectAi";

type Project = {
  id: string;
  name: string;
  description: string | null;
};

const API_URL = "http://localhost:3001";

export default function Home() {
  const { authenticated, token, login, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [message, setMessage] = useState("");

  const loadProjects = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-organization-slug": "acme",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load projects");
      }

      setProjects(result.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }, [token]);

  if (!authenticated) {
    return (
      <main>
        <h1>TenantAI</h1>
        <p>Sign in with Keycloak to access your projects.</p>
        <button onClick={login}>Sign in</button>
      </main>
    );
  }

  return (
    <main>
      <h1>TenantAI Projects</h1>
      <p>Signed in successfully.</p>

      <button onClick={loadProjects}>Load Acme projects</button>
      <button onClick={logout}>Sign out</button>

      {message && <p role="alert">{message}</p>}

      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <strong>{project.name}</strong>
            {project.description && <p>{project.description}</p>}
          </li>
        ))}
      </ul>
      <ProjectAI projects={projects} organizationSlug="acme" />
    </main>
  );
}
