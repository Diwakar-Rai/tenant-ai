import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8081",
  realm: "tenant-ai",
  clientId: "tenant-ai-frontend",
});

export default keycloak;
