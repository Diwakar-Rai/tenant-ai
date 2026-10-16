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
  const [organizationSlug, setOrganizationSlug] = useState("acme");
  const [message, setMessage] = useState("");

  const loadProjects = useCallback(async () => {
    if (!token) return;

    try {
      setMessage("Loading projects...");
      setProjects([]);

      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-organization-slug": organizationSlug,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load projects");
      }

      setProjects(result.data);
      setMessage(
        result.data.length
          ? `Loaded ${result.data.length} project(s) for ${organizationSlug}.`
          : `No projects found for ${organizationSlug}.`,
      );
    } catch (error) {
      setProjects([]);
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }, [token, organizationSlug]);

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

      <label htmlFor="organization">Organization: </label>
      <select
        id="organization"
        value={organizationSlug}
        onChange={(event) => {
          setOrganizationSlug(event.target.value);
          setProjects([]);
          setMessage("");
        }}
      >
        <option value="acme">Acme</option>
        <option value="globex">Globex</option>
      </select>

      <button onClick={loadProjects}>Load projects</button>
      <button onClick={logout}>Sign out</button>

      {message && <p role="status">{message}</p>}

      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <strong>{project.name}</strong>
            {project.description && <p>{project.description}</p>}
          </li>
        ))}
      </ul>

      <ProjectAI projects={projects} organizationSlug={organizationSlug} />
    </main>
  );
}
