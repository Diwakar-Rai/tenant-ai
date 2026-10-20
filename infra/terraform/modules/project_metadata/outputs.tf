output "metadata_file_path" {
  description = "Path to the generated project metadata file"
  value       = local_file.project_metadata.filename
}

output "metadata_content" {
  description = "Generated project metadata as JSON"
  value       = local_file.project_metadata.content
}