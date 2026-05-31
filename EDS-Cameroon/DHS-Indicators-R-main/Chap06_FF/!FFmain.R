# /*******************************************************************************************************************************
# Program: 			FFmain.R
# Purpose: 			Main file for the Fertility Preferences Chapter (Chap 06)
# Date last modified:	January 16, 2026
# *******************************************************************************************************************************/

rm(list = ls(all = TRUE))

# Chargement des bibliothèques
library(haven)
library(naniar)
library(dplyr)
library(sjlabelled)
library(expss)
library(xlsx)
library(data.table)
library(DHS.rates)

# --- CONFIGURATION DES CHEMINS ---
# Nous utilisons des chemins directs pour éviter les erreurs du package 'here'
project_root <- "D:/EDS-Cameroon/DHS-Indicators-R-main"
chap_folder  <- "Chap06_FF"
data_path    <- "D:/EDS-Cameroon"

# ATTENTION : Pour ce chapitre, vous devez utiliser le fichier IR (Femmes), pas HR (Ménages).
# Vérifiez que le fichier CMIR71FL.SAV est bien dans D:/EDS-Cameroon
IRdatafile <- "CMIR71FL.SAV" 

# Désactiver les alertes de renommage expss
options(expss.suppress_deprecation_warnings = TRUE)

#####################################################################################
## ANALYSE FEMMES (IR Data)
#####################################################################################

full_data_path <- paste0(data_path, "/", IRdatafile)

if (file.exists(full_data_path)) {
  # 1. Lecture du fichier
  IRdata <- read_sav(full_data_path)
  
  # 2. Harmonisation indispensable (Minuscules et correction du $)
  names(IRdata) <- tolower(names(IRdata))
  names(IRdata) <- gsub("\\$", "_", names(IRdata))
  setwd(paste0(project_root, "/", chap_folder))
  
  
  # 3. Exécution des scripts subordonnés
  # Vérifiez que ces fichiers .R sont bien dans D:/EDS-Cameroon/DHS-Indicators-R-main/Chap06_FF/
  source(paste0(project_root, "/", chap_folder, "/", "FF_PREF_WM.R"))
  source(paste0(project_root, "/", chap_folder, "/", "FF_tables_WM.R"))
  source(paste0(project_root, "/", chap_folder, "/", "FF_PLAN.R"))
  source(paste0(project_root, "/", chap_folder, "/", "FF_WANT_TFR.R"))
  
  print("Analyse terminée avec succès.")
} else {
  stop(paste("ERREUR : Le fichier", full_data_path, "est introuvable. Vérifiez l'emplacement de CMIR71FL.SAV"))
}
