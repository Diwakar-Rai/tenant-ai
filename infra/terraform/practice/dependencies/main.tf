terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "local" {}

resource "local_file" "tenantai_config" {
  filename = "${path.root}/tenantai-config.json"

  content = jsonencode({
    project_name = "TenantAI"
    environment  = "staging"
  })
}

resource "local_file" "tenantai_manifest" {
  filename = "${path.root}/tenantai-manifest.json"

  content = jsonencode({
    config_file = local_file.tenantai_config.filename
    application = "TenantAI API"
  })

  depends_on = [
    local_file.tenantai_config
  ]
}