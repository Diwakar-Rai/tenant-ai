terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "local" {}

module "tenantai_metadata" {
  source = "../../modules/project_metadata"

  project_name = var.project_name
  environment  = var.environment
  owner        = var.owner
  output_path  = "${path.root}/tenantai-metadata-staging.json"
}
