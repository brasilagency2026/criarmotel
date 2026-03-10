# Script PowerShell pour push automatique
param(
  [string]$Message = "Auto commit"
)

# Ajouter tous les fichiers
 git add .
# Commit avec message
 git commit -m "$Message"
# Push sur GitHub
 git push
