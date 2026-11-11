export type SpaceAgencyId =
  | "NASA"
  | "ESA"
  | "JAXA"
  | "ISRO"
  | "ROSCOSMOS"
  | "CNSA";

export type AgencyMeta = {
  id: SpaceAgencyId;
  shortName: string;
  fullName: string;
  country: string;
  badgeClass: string;
  activePillClass: string;
  dotColor: string;
  portalUrl: string;
};

export const SPACE_AGENCIES: Record<SpaceAgencyId, AgencyMeta> = {
  NASA: {
    id: "NASA",
    shortName: "NASA",
    fullName: "National Aeronautics and Space Administration",
    country: "USA",
    badgeClass: "border-sky-400/40 bg-sky-500/12 text-sky-200",
    activePillClass:
      "border-sky-400/60 bg-sky-500/20 text-white shadow-[0_0_14px_rgba(56,189,248,0.22)]",
    dotColor: "#38bdf8",
    portalUrl: "https://power.larc.nasa.gov/",
  },
  ESA: {
    id: "ESA",
    shortName: "ESA · Copernicus",
    fullName: "European Space Agency / Copernicus Programme",
    country: "Europe",
    badgeClass: "border-indigo-400/40 bg-indigo-500/12 text-indigo-200",
    activePillClass:
      "border-indigo-400/60 bg-indigo-500/20 text-white shadow-[0_0_14px_rgba(129,140,248,0.22)]",
    dotColor: "#818cf8",
    portalUrl: "https://dataspace.copernicus.eu/",
  },
  JAXA: {
    id: "JAXA",
    shortName: "JAXA",
    fullName: "Japan Aerospace Exploration Agency",
    country: "Japan",
    badgeClass: "border-emerald-400/40 bg-emerald-500/12 text-emerald-200",
    activePillClass:
      "border-emerald-400/60 bg-emerald-500/20 text-white shadow-[0_0_14px_rgba(52,211,153,0.22)]",
    dotColor: "#34d399",
    portalUrl: "https://gportal.jaxa.jp/",
  },
  ISRO: {
    id: "ISRO",
    shortName: "ISRO",
    fullName: "Indian Space Research Organisation (Bhuvan · MOSDAC)",
    country: "India",
    badgeClass: "border-amber-400/40 bg-amber-500/12 text-amber-200",
    activePillClass:
      "border-amber-400/60 bg-amber-500/20 text-white shadow-[0_0_14px_rgba(251,191,36,0.22)]",
    dotColor: "#fbbf24",
    portalUrl: "https://www.mosdac.gov.in/",
  },
  ROSCOSMOS: {
    id: "ROSCOSMOS",
    shortName: "Roscosmos",
    fullName: "Roscosmos / Roshydromet Planeta & AARI",
    country: "Russia",
    badgeClass: "border-cyan-400/40 bg-cyan-500/12 text-cyan-200",
    activePillClass:
      "border-cyan-400/60 bg-cyan-500/20 text-white shadow-[0_0_14px_rgba(34,211,238,0.22)]",
    dotColor: "#22d3ee",
    portalUrl: "http://arctic-aari.ru/",
  },
  CNSA: {
    id: "CNSA",
    shortName: "CNSA · CMA",
    fullName: "China National Space Administration / NSMC Fengyun",
    country: "China",
    badgeClass: "border-rose-400/40 bg-rose-500/12 text-rose-200",
    activePillClass:
      "border-rose-400/60 bg-rose-500/20 text-white shadow-[0_0_14px_rgba(251,113,133,0.22)]",
    dotColor: "#fb7185",
    portalUrl: "https://satellite.nsmc.org.cn/",
  },
};

export const SPACE_AGENCY_LIST: readonly SpaceAgencyId[] = [
  "NASA",
  "ESA",
  "JAXA",
  "ISRO",
  "ROSCOSMOS",
  "CNSA",
] as const;

export type ConcordanceType = "confirms" | "complements" | "extends";

export type AgencyRegionRecord = {
  agency: SpaceAgencyId;
  mission: string;
  sensorParameter: string;
  observedFinding: string;
  concordance: ConcordanceType;
  portalUrl: string;
};

export type ResearchReference = {
  title: string;
  authors: string;
  journal: string;
  year: number;
  doiUrl: string;
  agency: SpaceAgencyId;
};

export type RegionDossier = {
  regionId: string;
  headline: string;
  whatIsHappeningNow: string;
  complementarySynthesis: string;
  historicalAnecdote: {
    year: string;
    title: string;
    summary: string;
  };
  agencyRecords: AgencyRegionRecord[];
  references: ResearchReference[];
};

export const REGION_DOSSIERS: Record<string, RegionDossier> = {
  arctic: {
    regionId: "arctic",
    headline: "Polar Amplification & Multi-Year Sea-Ice Retreat",
    whatIsHappeningNow:
      "Warming at ~3–4× the global mean driven by ice-albedo feedback, warm Atlantic water inflow, and autumn freeze-up delays across the Greenland–Barents sector.",
    complementarySynthesis:
      "NASA POWER T2M tracks surface air warming; ESA CryoSat-2 measures sea-ice thickness loss; JAXA AMSR2 quantifies open-water fraction; and Roscosmos Arktika-M Molniya-orbit imagers provide continuous 15-minute polar cloud/albedo telemetry.",
    historicalAnecdote: {
      year: "2012 & 2020",
      title: "Record September Sea-Ice Minimums & Siberian Heat Dome",
      summary:
        "In September 2012, Arctic sea-ice extent fell to 3.39 million km² (lowest in the satellite record), followed by the 2020 Laptev Sea October freeze failure.",
    },
    agencyRecords: [
      {
        agency: "NASA",
        mission: "POWER MERRA-2 · GRACE-FO · ICESat-2",
        sensorParameter: "2m Air Temp (T2M) & Greenland Mass Balance",
        observedFinding:
          "Sustained positive surface temperature slope since 1981 paired with ~270 Gt/yr Greenland ice mass deficit.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "CryoSat-2 SIRAL & Sentinel-3 SLSTR",
        sensorParameter: "Sea-Ice Freeboard Thickness & Ice Surface Temp",
        observedFinding:
          "Multi-year pack ice volume in the central Arctic basin has contracted by >40% relative to the 1980s baseline.",
        concordance: "complements",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "GCOM-W1 (Shizuku) AMSR2",
        sensorParameter: "Passive Microwave Sea-Ice Concentration (18/36 GHz)",
        observedFinding:
          "Longer summer melt seasons (+5 to +10 days/decade) increase solar absorption in the upper ocean mixed layer.",
        concordance: "confirms",
        portalUrl: "https://gportal.jaxa.jp/",
      },
      {
        agency: "ROSCOSMOS",
        mission: "Arktika-M No.1/No.2 (Molniya Orbit) & Meteor-M",
        sensorParameter: "High-Latitude Elliptical Vis/IR Albedo & AARI Ice Drift",
        observedFinding:
          "Continuous polar cap imaging confirms rapid fast-ice breakup along the Northern Sea Route and Kara/Barents sectors.",
        concordance: "extends",
        portalUrl: "http://arctic-aari.ru/",
      },
      {
        agency: "CNSA",
        mission: "Fengyun-3D (FY-3D) MWRI & Haiyang-2B",
        sensorParameter: "Polar Microwave Brightness Temp & Scatterometer Wind",
        observedFinding:
          "Cross-calibrates transpolar drift acceleration and cyclone-induced sea-ice fracturing during autumn storms.",
        concordance: "complements",
        portalUrl: "https://satellite.nsmc.org.cn/",
      },
    ],
    references: [
      {
        title: "The Arctic has warmed nearly four times faster than the globe since 1979",
        authors: "Rantanen et al.",
        journal: "Communications Earth & Environment (Nature)",
        year: 2022,
        doiUrl: "https://doi.org/10.1038/s43247-022-00498-3",
        agency: "ESA",
      },
      {
        title: "Continuity of Ice Sheet Mass Loss in Greenland and Antarctica From GRACE/GRACE-FO",
        authors: "Velicogna et al.",
        journal: "Geophysical Research Letters",
        year: 2020,
        doiUrl: "https://doi.org/10.1029/2020GL087291",
        agency: "NASA",
      },
    ],
  },

  antarctic: {
    regionId: "antarctic",
    headline: "Circumpolar Vortex Buffering vs West Antarctic Basal Melt",
    whatIsHappeningNow:
      "The East Antarctic plateau remains thermally buffered by the Southern Annular Mode and circumpolar vortex, creating a striking surface temperature contrast with the rapidly warming Arctic.",
    complementarySynthesis:
      "While NASA POWER shows muted interior surface temperature trends, ESA CryoSat-2, NASA GRACE-FO, and ISRO Bharati/Dakshin Gangotri polar studies reveal that ocean-driven basal melting and post-2022 sea-ice anomalies dominate the coastal margin.",
    historicalAnecdote: {
      year: "2022–2024",
      title: "Antarctic Sea-Ice Regime Shift & Concordia +38.5°C Anomaly",
      summary:
        "In March 2022, an atmospheric river drove Dome C temperatures 38.5°C above climatology, followed by record-low winter sea-ice extents in 2023.",
    },
    agencyRecords: [
      {
        agency: "NASA",
        mission: "POWER MERRA-2 · GRACE-FO · ICESat-2",
        sensorParameter: "Interior Surface T2M & Ice Sheet Gravimetry",
        observedFinding:
          "East Antarctic interior surface temperature trend is near-neutral compared to the Arctic, illustrating opposite polar regime dynamics.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-1 SAR & CryoSat-2",
        sensorParameter: "Ice Shelf Grounding-Line Retreat & Calving Velocity",
        observedFinding:
          "Interferometric radar tracks accelerated ice-stream discharge in the Amundsen Sea Embayment despite cold plateau air.",
        concordance: "complements",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "GCOM-W AMSR2",
        sensorParameter: "Southern Ocean Sea-Ice Extent",
        observedFinding:
          "Documents the post-2016 transition from slight Antarctic sea-ice expansion to sharp negative anomalies in 2022–2024.",
        concordance: "extends",
        portalUrl: "https://gportal.jaxa.jp/",
      },
      {
        agency: "ISRO",
        mission: "Oceansat-3 (EOS-06) Scatterometer & Bharati Station",
        sensorParameter: "Southern Ocean Katabatic Wind & Sea-Ice Backscatter",
        observedFinding:
          "Ku-band scatterometry maps coastal polynya formation and wind-driven ice export off Prydz Bay and Enderby Land.",
        concordance: "complements",
        portalUrl: "https://www.mosdac.gov.in/",
      },
    ],
    references: [
      {
        title: "Antarctic sea ice at anall-time low: regime shift in ocean-ice coupling",
        authors: "Purich & Doddridge",
        journal: "Communications Earth & Environment",
        year: 2023,
        doiUrl: "https://doi.org/10.1038/s43247-023-00961-9",
        agency: "NASA",
      },
    ],
  },

  "western-ghats": {
    regionId: "western-ghats",
    headline: "Orographic Monsoon Volatility & Tropical Montane Canopy Stress",
    whatIsHappeningNow:
      "Warming Arabian Sea SSTs are shifting Western Ghats rainfall from steady monsoon drizzle toward short, extreme convective cloudbursts interspersed with prolonged dry spells.",
    complementarySynthesis:
      "NASA POWER captures the multi-decade temperature and moisture baseline; ISRO INSAT-3DR/MOSDAC resolves diurnal orographic rain cores; JAXA GPM/GSMaP tracks offshore monsoon depressions; and ESA Sentinel-2 + Pixxel hyperspectral indices monitor shola-forest canopy stress.",
    historicalAnecdote: {
      year: "2018–2024",
      title: "Kerala & Wayanad Extreme Orographic Cloudbursts",
      summary:
        "Multi-day rain anomalies exceeding 300 mm/48h triggered severe debris flows across the Western Ghats escarpment, linked to Arabian Sea warming.",
    },
    agencyRecords: [
      {
        agency: "ISRO",
        mission: "INSAT-3DR · Resourcesat-2A (AWiFS) · EOS-04 (RISAT-1A)",
        sensorParameter: "Hydro-Estimator Rainfall & C-Band All-Weather Canopy SAR",
        observedFinding:
          "MOSDAC records show intensifying sub-daily convective rain rates along the windward Sahyadri crest despite variable seasonal totals.",
        concordance: "confirms",
        portalUrl: "https://www.mosdac.gov.in/",
      },
      {
        agency: "NASA",
        mission: "POWER T2M / PRECTOTCORR & GPM Core Observatory",
        sensorParameter: "45-Year Monthly Temp/Precip & Dual-Frequency Radar",
        observedFinding:
          "Statistically significant surface warming (+0.15 to +0.22 °C/decade) increases atmospheric water-holding capacity (Clausius–Clapeyron).",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "JAXA",
        mission: "GSMaP & ALOS-2 PALSAR-2",
        sensorParameter: "Hourly Gauge-Calibrated Precip & L-Band Forest Biomass",
        observedFinding:
          "L-band radar penetrates monsoon cloud cover to verify evergreen biomass stability and slope saturation zones.",
        concordance: "complements",
        portalUrl: "https://sharaku.eorc.jaxa.jp/GSMaP/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-2 MSI & Sentinel-1 SAR",
        sensorParameter: "10m Red-Edge NDVI (NDRE) & Soil Moisture",
        observedFinding:
          "Pre-monsoon (March–May) vapor-pressure deficit spikes produce measurable red-edge chlorophyll stress in high-altitude plantations.",
        concordance: "extends",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
    ],
    references: [
      {
        title: "Roxy et al. — Threefold rise in widespread extreme rain events over central and western India",
        authors: "Roxy et al.",
        journal: "Nature Communications",
        year: 2017,
        doiUrl: "https://doi.org/10.1038/s41467-017-00744-9",
        agency: "ISRO",
      },
    ],
  },

  "indo-gangetic": {
    regionId: "indo-gangetic",
    headline: "Aerosol-Irrigation Hydro-Thermal Coupling in the Ganga Basin",
    whatIsHappeningNow:
      "Intensive canal/groundwater irrigation and high winter aerosol optical depth buffer daytime maximum temperatures while elevating relative humidity, moist heat stress, and winter radiation fog across the Lucknow–Kanpur–Patna corridor.",
    complementarySynthesis:
      "NASA POWER RH2M and solar shortwave (`ALLSKY_SFC_SW_DWN`) show solar dimming and humidity shifts; ISRO Bhuvan/INSAT-3D maps persistent winter fog; ESA Sentinel-5P TROPOMI quantifies NO2/CO/aerosol plumes; and NASA GRACE-FO tracks aquifer depletion.",
    historicalAnecdote: {
      year: "2022–2024",
      title: "Pre-Monsoon Humid Heatwaves & Winter Dense Fog Episodes",
      summary:
        "May–June wet-bulb temperature spikes across Uttar Pradesh and Bihar alternated with multi-week January zero-visibility radiation fog blankets.",
    },
    agencyRecords: [
      {
        agency: "ISRO",
        mission: "INSAT-3D/3DR (MOSDAC) & Resourcesat-2A (Bhuvan)",
        sensorParameter: "Microphysical Fog Detection & Rabi/Kharif Crop Evapotranspiration",
        observedFinding:
          "Widespread winter surface latent heat flux from irrigated wheat fields sustains high boundary-layer relative humidity.",
        concordance: "confirms",
        portalUrl: "https://bhuvan.nrsc.gov.in/",
      },
      {
        agency: "NASA",
        mission: "POWER (T2M, RH2M, SW_DWN) & GRACE-FO",
        sensorParameter: "Surface Shortwave Radiation, Humidity & Groundwater Equivalent",
        observedFinding:
          "All-sky surface downward shortwave radiation exhibits significant multi-decade attenuation tied to anthropogenic aerosol loading.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-5P TROPOMI & Copernicus C3S ERA5",
        sensorParameter: "Tropospheric NO2, CO, UV Aerosol Index & Wet-Bulb Temp",
        observedFinding:
          "High post-harvest and winter boundary-layer aerosol trapping reinforces temperature inversions across the alluvial plain.",
        concordance: "complements",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "CNSA",
        mission: "Fengyun-4B (FY-4B) AGRI & TanSat",
        sensorParameter: "Geostationary Aerosol Optical Depth & Convective Initiation",
        observedFinding:
          "Tracks cross-Himalayan upper-tropospheric westerly troughs interacting with moist Easterly Bay of Bengal inflow.",
        concordance: "extends",
        portalUrl: "https://satellite.nsmc.org.cn/",
      },
    ],
    references: [
      {
        title: "Irrigation cooling effect and humid heat extremes in the Indo-Gangetic Plain",
        authors: "Mishra et al.",
        journal: "Earth's Future (AGU)",
        year: 2020,
        doiUrl: "https://doi.org/10.1029/2019EF001392",
        agency: "NASA",
      },
    ],
  },

  sundarbans: {
    regionId: "sundarbans",
    headline: "Cyclonic Storm-Surge Intensification & Mangrove Salinity Stress",
    whatIsHappeningNow:
      "Rapid Bay of Bengal sea-surface warming fuels rapid-intensification cyclones while relative sea-level rise and deltaic subsidence push saline intrusion deeper into Sundarbans mangrove creeks.",
    complementarySynthesis:
      "NASA POWER tracks rising temperature and moisture flux; ISRO EOS-06/Resourcesat-2A monitors mangrove zonation; ESA Sentinel-3 altimetry measures deltaic sea-level rise; and JAXA ALOS-2 L-band SAR maps post-cyclone canopy recovery.",
    historicalAnecdote: {
      year: "2020 & 2024",
      title: "Super Cyclone Amphan & Cyclone Remal Embankment Breaches",
      summary:
        "Amphan (May 2020) and Remal (May 2024) produced prolonged saline inundation across the Indian and Bangladesh Sundarbans, accelerating transition from freshwater Heritiera fomes to salt-tolerant Avicennia species.",
    },
    agencyRecords: [
      {
        agency: "ISRO",
        mission: "Resourcesat-2A LISS-IV · EOS-04 SAR · Oceansat-3",
        sensorParameter: "Mangrove Species Zonation & Bay Head SST",
        observedFinding:
          "High-resolution optical and radar time series document shoreline erosion along southern islands (Jambudwip, Ghoramara, Bhangaduni).",
        concordance: "confirms",
        portalUrl: "https://www.mosdac.gov.in/",
      },
      {
        agency: "NASA",
        mission: "POWER · Landsat 8/9 · SWOT",
        sensorParameter: "Surface Thermal Trend & Estuarine Water Surface Elevation",
        observedFinding:
          "Consistent decadal warming over the northern Bay of Bengal margin elevates pre-monsoon and post-monsoon cyclone potential intensity.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-2 MSI & Sentinel-3 SRAL Altimetry",
        sensorParameter: "Canopy Chlorophyll Index & Relative Sea-Level Anomaly",
        observedFinding:
          "Effective sea-level rise in the Ganges–Brahmaputra delta (~4–7 mm/yr including subsidence) exceeds the global mean.",
        concordance: "complements",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "ALOS-2 PALSAR-2 & GPM DPR",
        sensorParameter: "L-Band Backscatter Canopy Structure & Cyclone Rain Bands",
        observedFinding:
          "Quantifies structural crown damage and subsequent 18-month regrowth trajectories following Category 4+ landfalls.",
        concordance: "extends",
        portalUrl: "https://gportal.jaxa.jp/",
      },
    ],
    references: [
      {
        title: "Sea-level rise and cyclone-induced salinity stress in the Sundarbans mangrove ecosystem",
        authors: "Payo et al.",
        journal: "Environmental Research Letters",
        year: 2016,
        doiUrl: "https://doi.org/10.1088/1748-9326/11/4/045006",
        agency: "ESA",
      },
    ],
  },

  amazon: {
    regionId: "amazon",
    headline: "Hydrological Lengthening of Dry Season & Canopy Thermal Stress",
    whatIsHappeningNow:
      "Combined tropical North Atlantic + El Niño warming and southern basin deforestation are lengthening the dry season, pushing river stages in the Rio Negro and Solimões to historic lows.",
    complementarySynthesis:
      "NASA POWER T2M and RH2M capture vapor-pressure deficit escalation; JAXA ALOS-2 PALSAR tracks deforestation and L-band biomass; ESA Sentinel-5P maps biomass-burning CO plumes; and CNSA TanSat / NASA OCO-2 measure net carbon flux reversals during drought years.",
    historicalAnecdote: {
      year: "2023–2024",
      title: "Record Rio Negro Low-Water Mark at Manaus (12.70 m)",
      summary:
        "During the 2023–2024 severe drought, water levels at the Port of Manaus dropped to their lowest level in 121 years of records, accompanied by widespread river temperature spikes >38°C.",
    },
    agencyRecords: [
      {
        agency: "NASA",
        mission: "POWER · MODIS Terra/Aqua · OCO-2 · EONET",
        sensorParameter: "Surface T2M, Evaporative Stress & Solar-Induced Fluorescence",
        observedFinding:
          "Significant warming and declining relative humidity increase canopy atmospheric water demand across central and southern Amazonia.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "JAXA",
        mission: "ALOS-2 PALSAR-2 (JJ-FAST) & GOSAT-2",
        sensorParameter: "All-Weather Radar Deforestation Alerts & Column CO2/CH4",
        observedFinding:
          "L-band radar detects early selective logging under persistent tropical cloud cover and quantifies edge-effect drying.",
        concordance: "complements",
        portalUrl: "https://gportal.jaxa.jp/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-2 MSI · Sentinel-5P TROPOMI · Biomass Mission",
        sensorParameter: "Canopy Water Content & Pyrogenic Carbon Monoxide",
        observedFinding:
          "TROPOMI CO and aerosol layer heights show drought-year understory fire emissions surging 2–3× above wet-year baselines.",
        concordance: "extends",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "CNSA",
        mission: "CBERS-04A (China–Brazil Joint Satellite) & TanSat",
        sensorParameter: "Wide-Field MUX/WPM Optical Monitoring & XCO2",
        observedFinding:
          "Joint INPE–CNSA CBERS imagery provides open-access 2m–8m monitoring of arc-of-deforestation land-use transitions.",
        concordance: "complements",
        portalUrl: "https://satellite.nsmc.org.cn/",
      },
    ],
    references: [
      {
        title: "Amazonia as a carbon source linked to deforestation and climate change",
        authors: "Gatti et al.",
        journal: "Nature",
        year: 2021,
        doiUrl: "https://doi.org/10.1038/s41586-021-03629-6",
        agency: "NASA",
      },
    ],
  },

  sahel: {
    regionId: "sahel",
    headline: "Multi-Decade Monsoon Recovery Paired with Extreme Thermal Amplification",
    whatIsHappeningNow:
      "Since the catastrophic 1970s–1980s droughts, warmer North Atlantic SSTs have pulled the Intertropical Convergence Zone northward, driving partial Sahelian re-greening alongside intense convective flash floods and >45°C spring heatwaves.",
    complementarySynthesis:
      "NASA POWER documents both the post-1981 rainfall recovery (`PRECTOTCORR`) and rapid surface warming (`T2M`); ESA SMOS/Sentinel-2 confirms herbaceous re-greening; and ISRO/CNES Megha-Tropiques + JAXA GSMaP resolve Mesoscale Convective Systems (MCS).",
    historicalAnecdote: {
      year: "2024",
      title: "April Sahel Heatwave (48.5°C in Kayes, Mali) & August Monsoon Floods",
      summary:
        "In April 2024, Mali and Burkina Faso recorded all-time heat records (>48°C), followed four months later by anomalous northward ITCZ surges that flooded Chad, Niger, and Mali.",
    },
    agencyRecords: [
      {
        agency: "NASA",
        mission: "POWER · MODIS NDVI · GRACE-FO",
        sensorParameter: "Surface T2M, Precipitation & Terrestrial Water Storage",
        observedFinding:
          "Positive precipitation slope since the early-1980s drought nadir coexists with strong background thermal warming.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "SMOS · Sentinel-2 MSI · Copernicus ERA5",
        sensorParameter: "L-Band Surface Soil Moisture & Dryland Vegetation Fraction",
        observedFinding:
          "Confirms woody and herbaceous vegetation expansion across the central Sahel belt driven by CO2 fertilization and rainfall recovery.",
        concordance: "confirms",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "ISRO",
        mission: "Megha-Tropiques (ISRO–CNES) SAPHIR & MADRAS",
        sensorParameter: "Tropical Tropospheric Humidity Profile & Convective Ice Water",
        observedFinding:
          "Demonstrates that Sahel rainfall recovery is dominated by fewer, more intense West African squall lines.",
        concordance: "complements",
        portalUrl: "https://www.mosdac.gov.in/",
      },
      {
        agency: "JAXA",
        mission: "GPM / GSMaP & GCOM-C (Shikisai)",
        sensorParameter: "Mesoscale Rain Rate & Saharan Dust Aerosol Optical Thickness",
        observedFinding:
          "Tracks Bodélé Depression dust export pulses that modulate Atlantic hurricane genesis and regional radiative balance.",
        concordance: "extends",
        portalUrl: "https://gportal.jaxa.jp/",
      },
    ],
    references: [
      {
        title: "Greening of the Earth and its drivers",
        authors: "Zhu et al.",
        journal: "Nature Climate Change",
        year: 2016,
        doiUrl: "https://doi.org/10.1038/nclimate3004",
        agency: "ESA",
      },
    ],
  },

  "n-atlantic": {
    regionId: "n-atlantic",
    headline: "Subtropical–Subpolar Marine Heatwaves & AMOC Fingerprint",
    whatIsHappeningNow:
      "The North Atlantic basin experienced unprecedented basin-wide sea-surface temperature anomalies in 2023–2025, driven by weakened Saharan dust/shipping sulfate aerosols, reduced trade winds, and multidecadal overturning dynamics.",
    complementarySynthesis:
      "NASA POWER tracks marine air temperature and solar radiation shifts (`ALLSKY_SFC_SW_DWN`); ESA Sentinel-3 SLSTR and JAXA AMSR2 provide skin/sub-skin SST; and CNSA Haiyang-2 / ISRO Oceansat-3 measure surface wind stress relaxation.",
    historicalAnecdote: {
      year: "2023–2024",
      title: "400+ Consecutive Days of Record North Atlantic SSTs",
      summary:
        "Beginning in March 2023, North Atlantic mean SSTs exceeded previous satellite records by >0.5°C for over a full year, fueling early-season Category 5 hurricanes.",
    },
    agencyRecords: [
      {
        agency: "NASA",
        mission: "POWER · MODIS Aqua SST · Jason-3 / Sentinel-6",
        sensorParameter: "Marine 2m Air Temp, Shortwave Flux & Sea Surface Height",
        observedFinding:
          "Significant positive temperature trend paired with shifts in surface shortwave radiation over the eastern Atlantic.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-3 SLSTR & SMOS Sea Surface Salinity",
        sensorParameter: "Dual-View Skin SST & Subpolar Gyre Salinity",
        observedFinding:
          "Maps the juxtaposition of extreme subtropical/mid-latitude warming with subpolar freshening south of Greenland.",
        concordance: "confirms",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "GCOM-W AMSR2",
        sensorParameter: "All-Weather Microwave SST (6.9 GHz)",
        observedFinding:
          "Penetrates marine stratocumulus decks to confirm subsurface mixed-layer heat accumulation.",
        concordance: "complements",
        portalUrl: "https://gportal.jaxa.jp/",
      },
      {
        agency: "CNSA",
        mission: "Haiyang-2C/2D (HY-2) Radar Altimeter & Scatterometer",
        sensorParameter: "Trade-Wind Vector Anomaly & Eddy Kinetic Energy",
        observedFinding:
          "Documents weaker Azores High wind speeds that reduced evaporative ocean cooling during the 2023–2024 heatspike.",
        concordance: "extends",
        portalUrl: "https://satellite.nsmc.org.cn/",
      },
    ],
    references: [
      {
        title: "Uncharted waters: mechanisms of the 2023 North Atlantic marine heatwave",
        authors: " Kuhlbrodt et al.",
        journal: "Bulletin of the American Meteorological Society",
        year: 2024,
        doiUrl: "https://doi.org/10.1175/BAMS-D-23-0241.1",
        agency: "ESA",
      },
    ],
  },

  "w-pacific": {
    regionId: "w-pacific",
    headline: "Indo-Pacific Warm Pool Expansion & Western Pacific Typhoon Genesis",
    whatIsHappeningNow:
      "The Western Pacific Warm Pool (>28.5°C isotherm) has expanded nearly twofold since the 1980s, anchoring the rising branch of the Walker Circulation and intensifying western Pacific moisture convergence.",
    complementarySynthesis:
      "NASA POWER tracks long-term surface warming and precipitation; JAXA Himawari-8/9 and GPM DPR monitor typhoon rapid intensification; CNSA Fengyun-4B tracks convective cloud-top cooling; and ESA Sentinel-6 measures thermosteric sea-level rise.",
    historicalAnecdote: {
      year: "2013 & 2023",
      title: "Super Typhoon Haiyan & Warm-Pool Subsurface Heat Content Records",
      summary:
        "Deep thermocline heat storage in the Philippine Sea and Caroline Basin enabled repeated rapid intensification events where typhoons gained >50 kt in 24 hours.",
    },
    agencyRecords: [
      {
        agency: "JAXA",
        mission: "GPM Core / GSMaP · GCOM-W AMSR2 · Himawari-8/9",
        sensorParameter: "3D Typhoon Precipitation Structure & Warm-Pool SST",
        observedFinding:
          "Confirms expansion of the 29°C warm pool core and elevated latent heat release in western Pacific tropical cyclones.",
        concordance: "confirms",
        portalUrl: "https://gportal.jaxa.jp/",
      },
      {
        agency: "NASA",
        mission: "POWER · Jason-3 / Sentinel-6 Michael Freilich",
        sensorParameter: "Marine T2M, PRECTOTCORR & Sea Surface Height Anomaly",
        observedFinding:
          "Steady decadal warming and elevated sea-surface heights driven by trade-wind heat piling in the western basin.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "CNSA",
        mission: "Fengyun-4B (FY-4B) GIIRS & Haiyang-2D",
        sensorParameter: "Hyperspectral Geostationary IR Sounding & Ocean Surface Wind",
        observedFinding:
          "Resolves 3D tropospheric moisture instability ahead of westward-tracking typhoons entering the Philippine and South China Seas.",
        concordance: "complements",
        portalUrl: "https://satellite.nsmc.org.cn/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-3 OLCI & SLSTR",
        sensorParameter: "Chlorophyll-a Stratification & Thermal Skin Temp",
        observedFinding:
          "Stronger upper-ocean thermal stratification reduces nutrient upwelling across oligotrophic western Pacific gyre margins.",
        concordance: "extends",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
    ],
    references: [
      {
        title: "Twofold expansion of the Indo-Pacific warm pool warps the MJO life cycle",
        authors: "Roxy et al.",
        journal: "Nature",
        year: 2019,
        doiUrl: "https://doi.org/10.1038/s41586-019-1764-4",
        agency: "NASA",
      },
    ],
  },

  "bay-of-bengal": {
    regionId: "bay-of-bengal",
    headline: "Halocline Barrier Layer & Monsoon Depression Genesis Engine",
    whatIsHappeningNow:
      "Massive freshwater runoff from the Ganga–Brahmaputra–Meghna and Irrawaddy rivers creates a shallow, salinity-stratified barrier layer that traps solar heat near the surface and fuels monsoon depressions and severe cyclones.",
    complementarySynthesis:
      "NASA POWER quantifies long-term thermal and precipitation shifts; ISRO MOSDAC (Oceansat-3 / INSAT-3DR) tracks monsoon low-pressure systems; ESA SMOS measures freshwater plume salinity; and JAXA GSMaP captures oceanic rain accumulation.",
    historicalAnecdote: {
      year: "2023–2024",
      title: "Cyclone Mocha & Marine Heatwave Persistence in the Central Bay",
      summary:
        "In May 2023, Cyclone Mocha reached 150 kt over 31°C Bay of Bengal waters where strong salinity stratification prevented cold-water upwelling.",
    },
    agencyRecords: [
      {
        agency: "ISRO",
        mission: "INSAT-3DR · Oceansat-3 (EOS-06) · SARAL/AltiKa",
        sensorParameter: "Cyclogenesis Heat Potential, Ocean Color & Ka-Band Altimetry",
        observedFinding:
          "SARAL/AltiKa sea-surface height anomalies identify warm-core eddies that trigger rapid cyclone intensification.",
        concordance: "confirms",
        portalUrl: "https://www.mosdac.gov.in/",
      },
      {
        agency: "NASA",
        mission: "POWER · SMAP Sea Surface Salinity · MODIS",
        sensorParameter: "Surface T2M, Precipitation & Freshwater Plume Salinity",
        observedFinding:
          "Warming surface trends coincide with high monsoon-season precipitation and low surface salinity (<28 PSU) in the northern Bay.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "SMOS & Sentinel-3",
        sensorParameter: "Barrier-Layer Salinity Gradient & Skin SST",
        observedFinding:
          "Tracks post-monsoon southward advection of the low-salinity river plume along the East India Coastal Current.",
        concordance: "complements",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "GPM / GSMaP & AMSR2",
        sensorParameter: "Column Water Vapor & Oceanic Rain Rate",
        observedFinding:
          "Quantifies total precipitable water (>65 kg/m²) feeding southwest monsoon surges toward eastern India and Myanmar.",
        concordance: "complements",
        portalUrl: "https://gportal.jaxa.jp/",
      },
    ],
    references: [
      {
        title: "Barrier layer control on tropical cyclone intensification in the Bay of Bengal",
        authors: "Balaguru et al.",
        journal: "Proceedings of the National Academy of Sciences (PNAS)",
        year: 2012,
        doiUrl: "https://doi.org/10.1073/pnas.1201364109",
        agency: "ISRO",
      },
    ],
  },

  "gulf-of-mexico": {
    regionId: "gulf-of-mexico",
    headline: "Loop Current Deep Thermal Reservoir & Coastal Surge Amplification",
    whatIsHappeningNow:
      "Subsurface warming in the Gulf of Mexico Loop Current and persistent summer marine heatwaves provide high Ocean Heat Content (OHC) that drives rapid hurricane intensification and elevated Gulf Coast humid heat.",
    complementarySynthesis:
      "NASA POWER tracks surface temperature and humidity (`RH2M`); NASA EONET v3 flags active tropical storms and coastal wildfires; ESA Sentinel-3/6 maps Loop Current warm-core rings; and JAXA AMSR2 monitors all-weather SST under hurricane cirrus canopies.",
    historicalAnecdote: {
      year: "2023–2024",
      title: "32°C+ Summer Shelf Waters & Rapid Intensification of Idalia / Helene / Milton",
      summary:
        "Record summer Gulf of Mexico shelf and Loop Current temperatures (>31.5°C) supported repeated 24-hour rapid intensification cycles prior to Gulf Coast landfall.",
    },
    agencyRecords: [
      {
        agency: "NASA",
        mission: "POWER · EONET v3 · SWOT · CYGNSS",
        sensorParameter: "Marine T2M, Inner-Core Hurricane Winds & Sea Surface Height",
        observedFinding:
          "CYGNSS L-band GPS reflectometry measures ocean surface winds directly beneath heavy eyewall precipitation.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-3 SLSTR/OLCI & Sentinel-6 Altimetry",
        sensorParameter: "Loop Current Eddy Shedding & Mississippi Hypoxic Plume",
        observedFinding:
          "Altimetry tracks 20–30 cm sea-surface height domes marking deep warm-core eddies detached from the Loop Current.",
        concordance: "complements",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "GCOM-W AMSR2 & GPM",
        sensorParameter: "Cloud-Penetrating Microwave SST & Rain Rate",
        observedFinding:
          "Verifies minimal cold-wake cooling behind fast-moving storms traversing the deep Gulf thermal layer.",
        concordance: "confirms",
        portalUrl: "https://gportal.jaxa.jp/",
      },
    ],
    references: [
      {
        title: "Anthropogenic warming has increased Gulf of Mexico ocean heat content and hurricane intensification",
        authors: "Trenberth et al.",
        journal: "Earth's Future (AGU)",
        year: 2018,
        doiUrl: "https://doi.org/10.1029/2018EF000825",
        agency: "NASA",
      },
    ],
  },

  siberia: {
    regionId: "siberia",
    headline: "Boreal Permafrost Thaw, Snow-Albedo Feedback & Taiga Wildfire Regime",
    whatIsHappeningNow:
      "Central and Eastern Siberia warm at more than double the global average as earlier spring snowmelt exposes dark taiga and tundra, accelerating active-layer permafrost thaw, thermokarst lake formation, and high-latitude peat fires.",
    complementarySynthesis:
      "NASA POWER T2M documents rapid continental warming; Roscosmos Meteor-M / Arktika-M tracks spring snow-cover retreat; ESA Sentinel-5P TROPOMI maps methane (`CH4`) and wildfire carbon monoxide plumes; and JAXA ALOS-2 / GOSAT monitor L-band ground subsidence and borehole/column greenhouse fluxes.",
    historicalAnecdote: {
      year: "2020–2021",
      title: "Verkhoyansk 38.0°C Arctic Circle Record & Sakha Republic Megafires",
      summary:
        "In June 2020, Verkhoyansk recorded 38.0°C (WMO-verified record north of the Arctic Circle), followed by the 2021 Yakutia taiga fires that burned >18 million hectares.",
    },
    agencyRecords: [
      {
        agency: "ROSCOSMOS",
        mission: "Meteor-M No.2-3 · Arktika-M · Kanopus-V",
        sensorParameter: "Snow-Cover Disappearance Date & Boreal Thermal Hotspots",
        observedFinding:
          "Roshydromet Planeta records show spring snow disappearance advancing by 3–5 days per decade across the Yenisei and Lena basins.",
        concordance: "confirms",
        portalUrl: "http://planet.iitp.ru/",
      },
      {
        agency: "NASA",
        mission: "POWER T2M · FIRMS MODIS/VIIRS · EONET v3",
        sensorParameter: "45-Year Surface Air Temp & Active Fire Radiative Power",
        observedFinding:
          "Strong, statistically significant warming trend (+0.45 to +0.60 °C/decade) with heightened summer vapor-pressure deficit.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-5P TROPOMI & CCI Permafrost",
        sensorParameter: "Atmospheric Methane (XCH4), CO & Permafrost Active-Layer Depth",
        observedFinding:
          "Detects elevated methane anomalies over thawing carbonate/yedoma formations and huge pyrogenic CO plumes during summer fire waves.",
        concordance: "extends",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "GOSAT-2 (Ibuki-2) & ALOS-2 PALSAR-2 InSAR",
        sensorParameter: "Column CH4/CO2 & Thermokarst Ground Subsidence",
        observedFinding:
          "L-band InSAR measures seasonal thaw subsidence (2–8 cm/summer) across ice-rich Siberian yedoma uplands.",
        concordance: "complements",
        portalUrl: "https://gportal.jaxa.jp/",
      },
      {
        agency: "CNSA",
        mission: "Fengyun-3D/3E & Gaofen-4",
        sensorParameter: "Eurasian Cold-Vortex Tracking & Boreal Smoke Transport",
        observedFinding:
          "Monitors trans-boundary smoke aerosol transport from East Siberia into Manchuria and the North Pacific.",
        concordance: "complements",
        portalUrl: "https://satellite.nsmc.org.cn/",
      },
    ],
    references: [
      {
        title: "ExponentiallyIncreasing Boreal Wildfire Emissions in Siberia Under Climate Warming",
        authors: "Descals et al.",
        journal: "Science",
        year: 2022,
        doiUrl: "https://doi.org/10.1126/science.abn9768",
        agency: "ESA",
      },
    ],
  },

  "sw-usa": {
    regionId: "sw-usa",
    headline: "North American Megadrought, Evaporative Demand & Colorado Basin Aridification",
    whatIsHappeningNow:
      "Persistent subtropical ridge blocking, rising temperatures, and declining relative humidity (`RH2M`) have driven a 24-year southwestern megadrought, reducing Colorado River runoff sensitivity per unit of winter snowpack.",
    complementarySynthesis:
      "NASA POWER T2M, PRECTOTCORR, and RH2M quantify the simultaneous warming and atmospheric drying; NASA GRACE-FO tracks Lake Mead/Powell and groundwater storage; ESA Sentinel-2 monitors chaparral/conifer dieback; and live NASA EONET v3 tracks active Western wildfires.",
    historicalAnecdote: {
      year: "2000–2024",
      title: "Driest 22-Year Period in 1,200 Years & 2023 Phoenix 31-Day ≥43.3°C Streak",
      summary:
        "Tree-ring reconstructions combined with satellite soil-moisture records confirmed 2000–2021 as the driest multi-decade span in southwestern North America since at least 800 CE.",
    },
    agencyRecords: [
      {
        agency: "NASA",
        mission: "POWER · GRACE-FO · ECOSTRESS (ISS) · EONET v3",
        sensorParameter: "T2M, RH2M, Terrestrial Water Storage & Plant Canopy Temp",
        observedFinding:
          "Statistically significant temperature rise and relative humidity decline amplify potential evapotranspiration across the Colorado Basin.",
        concordance: "confirms",
        portalUrl: "https://power.larc.nasa.gov/",
      },
      {
        agency: "ESA",
        mission: "Sentinel-2 MSI · SMOS · Copernicus C3S",
        sensorParameter: "Root-Zone Soil Moisture Deficit & Conifer Mortality NDVI",
        observedFinding:
          "Documents widespread bark-beetle and drought mortality across Sierra Nevada and southern Rocky Mountain montane forests.",
        concordance: "confirms",
        portalUrl: "https://dataspace.copernicus.eu/",
      },
      {
        agency: "JAXA",
        mission: "GCOM-W AMSR2 & ALOS-2 InSAR",
        sensorParameter: "Mountain Snow Water Equivalent & Aquifer Compaction Subsidence",
        observedFinding:
          "InSAR detects land subsidence bowls in central Arizona and California's San Joaquin Valley during surface-water curtailment years.",
        concordance: "extends",
        portalUrl: "https://gportal.jaxa.jp/",
      },
      {
        agency: "ISRO",
        mission: "NISAR (NASA–ISRO L/S-Band SAR Calibration Benchmark)",
        sensorParameter: "Dual-Band Deformation & Soil Moisture Benchmark",
        observedFinding:
          "Southwestern US corner reflectors and agricultural basins serve as primary calibration/validation sites for joint NASA–ISRO radar science.",
        concordance: "complements",
        portalUrl: "https://nisar.jpl.nasa.gov/",
      },
    ],
    references: [
      {
        title: "Rapid intensification of the emerging southwestern North American megadrought in 2020–2021",
        authors: "Williams et al.",
        journal: "Nature Climate Change",
        year: 2022,
        doiUrl: "https://doi.org/10.1038/s41558-022-01290-z",
        agency: "NASA",
      },
    ],
  },
};

export function getRegionDossier(regionId: string): RegionDossier | undefined {
  return REGION_DOSSIERS[regionId];
}

export function regionHasAgency(regionId: string, agency: SpaceAgencyId): boolean {
  const dossier = REGION_DOSSIERS[regionId];
  if (!dossier) return agency === "NASA";
  return dossier.agencyRecords.some((rec) => rec.agency === agency);
}
