resource "local_file" "project_metadata" {
  filename = var.output_path

  content = jsonencode({
    project_name = var.project_name
    environment  = var.environment
    owner        = var.owner
  })
}