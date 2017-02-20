##### addDatasetData.js
combine each mapping dataset into one boundary lookup

##### service-mapping.js
maps CCG\_code and practice code (serviceId)

##### service-lsoa-patients
maps practice code (serviceId) with LSOA code from original raw Excel file 

##### poplet-mapping.js
with "service-mapping"& "patients-mapping serviceId lsoa" on TBX, map the CCG\_code and LSOA code

##### neighbour mapping files
maps 15m neighbour from CCG\_code to LSOA code, the data source is Gavin's 15m LAD15-LSOA11

##### ons-mapping
maps LSOAs in CCG area (Not the same as patients mapping)
DEBUG=* node ons\-mapping.js ./rawFiles/LSOA11\_CCG16\_LAD16\_EN\_LU.csv

##### raw files

LSOA11\_CCG16\_LAD16\_EN\_LU.csv
gp\-reg\-patients\-prac\-sing\-year\-age.csv
gp\-reg\-patients\-LSOA.csv

http://content.digital.nhs.uk/searchcatalogue?productid=22190&q=lsoa&topics=1%2fPrimary+care+services%2fGeneral+practice&sort=Relevance&size=10&page=1#top
