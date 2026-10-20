variable "project_name" {
  description = "Name of the application project"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string


  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging or prod"
  }
}

variable "owner" {
  description = "Team responsible for the project"
  type        = string
}

variable "output_path" {
  description = "Absolute path for the generated metadata file"
  type        = string
}