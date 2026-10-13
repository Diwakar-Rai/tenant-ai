"use client";

import { useState } from "react";
import keycloak from "../lib/keycloak";

type Project = {
  id: string;
  name: string;
};

type AiInteraction = {
  id: string;
  question: string;
  answer: string;
  mode: string;
};

type Props = {
  projects: Project[];
  organizationSlug: string;
};

const API_URL = "http://localhost:3001";

export default function ProjectAI({ projects, organizationSlug }: Props) {
  const [projectId, setProjectId] = useState("");
  const [question, setQuestion] = useState("");
  const [interaction, setInteraction] = useState<AiInteraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askAI() {
    if (!projectId || !question.trim()) {
      throw new Error("Project Id missing or no proper question found");
    }

    setLoading(true);
    setError("");
    setInteraction(null);

    try {
      // Refresh shortly-expiring access tokens.
      await keycloak.updateToken(30);

      if (!keycloak.token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch(
        `${API_URL}/api/ai/projects/${projectId}/ask`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            "Content-Type": "application/json",
            "x-organization-slug": organizationSlug,
          },
          body: JSON.stringify({ question }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI request failed");
      }

      setInteraction(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <h2>Ask TenantAI</h2>

      <label htmlFor="project">Project</label>
      <select
        id="project"
        value={projectId}
        onChange={(event) => setProjectId(event.target.value)}
      >
        <option value="">Select a project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="question">Your question</label>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={2000}
          rows={4}
          style={{ display: "block", width: "100%" }}
        />
      </div>

      <button
        onClick={askAI}
        // disabled={loading || !projectId || !question.trim()}
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {error && <p role="alert">{error}</p>}

      {interaction && (
        <div style={{ marginTop: 20 }}>
          <h3>AI response</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{interaction.answer}</p>
          <small>Mode: {interaction.mode}</small>
        </div>
      )}
    </section>
  );
}
