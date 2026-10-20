output "metadata_file_path" {
  description = "Location of the generated metadata file"
  value       = module.tenantai_metadata.metadata_file_path
}

output "metadata_content" {
  description = "Generated TenantAI metadata"
  value       = module.tenantai_metadata.metadata_content
}
