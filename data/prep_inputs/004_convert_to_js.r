library(ePiE)
library(zip)
library(mapview)
library(sf)
library(terra)
library(fst)
library(jsonlite)
sf_use_s2(FALSE)

# wd
# wd = "C:/Users/Selwyn Hoeks/Documents/GitHub/epie_gui_v2/exclude_build/prep_inputs/"
wd = "/Users/osx/Documents/GithubLocal/ePiE_webApp/data/resources/" # extract basins.7z first
setwd(wd)

# make js dir
dir.create("basins_js", showWarnings = FALSE)

# csv files
csvf = list.files("basins/", pattern = "\\.csv$", recursive = TRUE, full.names = TRUE)
csvf = data.frame(f = csvf, dt=NA, stringsAsFactors = FALSE)

# function to determine file type
csvf$dt[grep("pts_",csvf$f)] = "pts"
csvf$dt[grep("avg_",csvf$f)] = "pts"
csvf$dt[grep("ma_",csvf$f)] = "pts"
csvf$dt[grep("mi_",csvf$f)] = "pts"
csvf$dt[grep("hl_",csvf$f)] = "hl"
csvf$dt[grep("BasinIndex",csvf$f)] = "BasinIndex"

# process BasinIndex first
which_basinindex = which(csvf$dt == "BasinIndex")
f = csvf[which_basinindex, "f"]
print(f)
d = read.csv(f)
head(d)
dlist = list()
for (i in 1:nrow(d)) {
  basin_id = d$basin_id[i]
  basin_id = d$basin_id[i]
  dlist[[basin_id]] = d$file_index[i]
}
length(dlist)
dim(d)
all(names(dlist) == d$basin_id)
djs = toJSON(dlist, pretty = FALSE)
djs2 = paste0("const BasinIndex = ","\n",djs,"\n",";")
write(djs2, file = "basins_js/BasinIndex.js")

# remove processed file
csvf = csvf[-which_basinindex, ]
dim(csvf)

# testing index
i = 1
i = grep("pts_000023", csvf$f)

# process all other files
for (i in 1:nrow(csvf)) {
  print(csvf$f[i])
  d = read.csv(csvf$f[i])
  head(d)
  if(grepl("pts_000023", csvf$f[i])){ # compress file pts_000023?
    d$T_AIR = round(d$T_AIR, 1)
    d$Wind = round(d$Wind, 1)
    d$pH = round(d$pH, 1)
    d$snap_dist = NULL
    d$Dist_down = round(d$Dist_down, 2)
    d$dist_nxt = round(d$dist_nxt, 2)
  }
  basin_ids = unique(d$basin_id)
  dlist = list()
  for (basin_id in basin_ids) {
    dsub = d[d$basin_id == basin_id, ]
    dsub$line_node = NULL
    dsub$uwwID = NULL
    dsub$uwwName = NULL
    dsub$uwwLatit_1 = NULL
    dsub$uwwLongi_1 = NULL
    dsub$aggLatit_1 = NULL
    dsub$aggLongi_1 = NULL
    dsub$aggCode = NULL
    dsub$aggName = NULL
    dsub$aggID = NULL
    dsub$basin_id = NULL
    dsub$LD_new = NULL
    dlist[[as.character(basin_id)]] = dsub
  }
  str(dlist)
  djs = toJSON(dlist, pretty = FALSE, auto_unbox = TRUE, digits = 3)
  varname = strsplit(basename(csvf$f[i]), "\\.")[[1]][1]
  djs2 = paste0("export const ", varname, " = ","\n",djs,"\n",";")
  outfn = paste0("basins_js/", tools::file_path_sans_ext(basename(csvf$f[i])), ".js")
  write(djs2, file = outfn)
}
# pts_000023 too large (>100mb)?