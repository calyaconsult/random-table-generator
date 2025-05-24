const fs = require("fs");
const monthnames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((x) => {
  return x.substr(0, 3);
});

const fillWithRandVals = (a) => {
  var arr = a;
  return () => {
    if (!Array.isArray(arr)) return arr;
    return arr.map((x) => {
      return Math.floor(Math.random() * 1000);
    });
  };
};

function generateTableData(targetMonthIndex, targetYear) {
  const month = monthnames[targetMonthIndex];
  const currentYear = targetYear;
  const previousYear = currentYear - 1;
  var groups = ["total", "devices"];
  var devices = ["desktop", "mobile", "tablet"];

  // Defines the "meaning" of columns in the generated data structure,
  // which is an array of columns (effectively row headers/categories).
  const baseColumns = [
    "Monat", // Month name (e.g., "Jan")
    "Monat Text", // Month and year (e.g., "Jan 2023")
    "Unique Users",
    "Visits",
    "Pageviews",
    "Pageviews/Visit",
    "Avg. Time on Page",
    "Avg. Session Duration",
    "Avg. Read Time",
    "Use Time",
    "Field Type", // Metadata about the row's data type (generated, calculated)
  ];

  const ROW_CATEGORIES = {
    MONAT: 0,
    MONAT_TEXT: 1,
    UNIQUE_USERS: 2,
    VISITS: 3,
    PAGEVIEWS: 4,
    PAGEVIEWS_PER_VISIT: 5,
    AVG_TIME_ON_PAGE: 6,
    AVG_SESSION_DURATION: 7,
    AVG_READ_TIME: 8,
    USE_TIME: 9,
    FIELD_TYPE: 10,
  };

  // Indices for accessing specific data points within a row category's array.
  // These correspond to the headers defined in table[0].
  const DATA_COLUMN_INDICES = {
    LABEL: 0, // The first element is usually the label (e.g., "Unique Users")
    CURRENT_YEAR_TOTAL: 1,
    PREVIOUS_YEAR_TOTAL: 2,
    PERCENT_CHANGE_TOTAL: 3,
    BLANK_SPACER_1: 4,
    CURRENT_YEAR_DESKTOP: 5,
    CURRENT_YEAR_MOBILE: 6,
    CURRENT_YEAR_TABLET: 7,
    BLANK_SPACER_2: 8,
    PREVIOUS_YEAR_DESKTOP: 9,
    PREVIOUS_YEAR_MOBILE: 10,
    PREVIOUS_YEAR_TABLET: 11,
    BLANK_SPACER_3: 12,
    PERCENT_CHANGE_DESKTOP: 13,
    PERCENT_CHANGE_MOBILE: 14,
    PERCENT_CHANGE_TABLET: 15,
  };
  const ALL_DATA_COLUMN_INDICES = Object.values(DATA_COLUMN_INDICES);


  var rowsInner;
  // table[0] defines the header structure for the data columns
  var table = [
    [
      baseColumns[ROW_CATEGORIES.MONAT], // "Monat"
      currentYear,
      previousYear,
      "Veränderung", // Header for PERCENT_CHANGE_TOTAL
      "{BLANK}",
      ...Array(3).fill(currentYear), // Headers for CURRENT_YEAR_DESKTOP, _MOBILE, _TABLET
      "{BLANK}",
      ...Array(3).fill(previousYear), // Headers for PREVIOUS_YEAR_DESKTOP, _MOBILE, _TABLET
      "{BLANK}",
      ...Array(3).fill("Veränderung"), // Headers for PERCENT_CHANGE_DESKTOP, _MOBILE, _TABLET
    ],
  ];

  // Iterate through baseColumns to build the table structure
  // Starts from 1 to skip "Monat" which is already in table[0]
  // Ends before "Field Type" which is added last
  for (let c = ROW_CATEGORIES.MONAT_TEXT; c < ROW_CATEGORIES.FIELD_TYPE; c++) {
    for (let g = 0; g < groups.length; g++) {
      switch (groups[g]) {
        case "total":
          // For data rows (Unique Users, Visits, etc.)
          if (c >= ROW_CATEGORIES.UNIQUE_USERS) {
            rowsInner = [baseColumns[c], Array(3).fill("calc"), "{BLANK}"];
          } else { // For "Monat Text" row
            rowsInner = [
              baseColumns[c], // "Monat Text"
              `${month} ${currentYear}`,
              `${month} ${previousYear}`,
              "Total", // Corresponds to PERCENT_CHANGE_TOTAL column header group
              "{BLANK}",
            ];
          }
          break;
        case "devices":
          if (c >= ROW_CATEGORIES.UNIQUE_USERS) {
            rowsInner = [
              ...rowsInner, // from "total" case
              Array(3).fill("calc"), // for current year devices
              "{BLANK}",
              Array(3).fill("calc"), // for previous year devices
              "{BLANK}",
              Array(3).fill("calc"), // for percent change devices
            ];
          } else { // For "Monat Text" row, add device labels
            rowsInner = [
              ...rowsInner, // from "total" case
              ...devices, // CURRENT_YEAR_DESKTOP, _MOBILE, _TABLET labels
              "{BLANK}",
              ...devices, // PREVIOUS_YEAR_DESKTOP, _MOBILE, _TABLET labels
              "{BLANK}",
              ...devices, // PERCENT_CHANGE_DESKTOP, _MOBILE, _TABLET labels
            ];
          }
          break;
        default:
      }
    }
    table.push(
      rowsInner
        .map((x) => {
          // Fill "calc" placeholders with random numbers for now
          return fillWithRandVals(x)();
        })
        .flat(),
    );
  }

  // Add the "Field Type" row category as the last one
  table.push([
    table[DATA_COLUMN_INDICES.LABEL].map((x, i) => {
      // x is the header from table[0] for this column index i
      // table[DATA_COLUMN_INDICES.LABEL] is table[0] effectively
      switch (x) {
        case table[DATA_COLUMN_INDICES.LABEL][DATA_COLUMN_INDICES.LABEL]: // If x is "Monat" (the first header)
          return baseColumns[ROW_CATEGORIES.FIELD_TYPE]; // Set first cell to "Field Type"
        case "{BLANK}":
          return "{BLANK}";
        case "Veränderung":
          return "calculated"; // Mark "Veränderung" columns as calculated
        default:
          // If it's a year (e.g. 2023, 2022), or any other header not caught above
          return "generated"; // Mark data columns as generated
      }
    }),
  ]);


  // Identify which data columns (indices within a row category) are for "Veränderung"
  const percentChangeColumnIndices = table[DATA_COLUMN_INDICES.LABEL]
    .map((headerText, index) => {
      if (headerText == "Veränderung") return index;
    })
    .filter((index) => index !== undefined); // Filter out undefined entries

  // Define offsets to find current and previous year data relative to a "Veränderung" column.
  // For PERCENT_CHANGE_TOTAL (index 3): current is index 1, previous is index 2. Offset: (3-1)=2, (3-2)=1
  // For PERCENT_CHANGE_DESKTOP (index 13): current is index 5, previous is index 9. Offset: (13-5)=8, (13-9)=4
  // Structure: [offsetForCurrentData, offsetForPreviousData]
  const percentChangeOffsets = {
    [DATA_COLUMN_INDICES.PERCENT_CHANGE_TOTAL]: [
        DATA_COLUMN_INDICES.PERCENT_CHANGE_TOTAL - DATA_COLUMN_INDICES.CURRENT_YEAR_TOTAL,
        DATA_COLUMN_INDICES.PERCENT_CHANGE_TOTAL - DATA_COLUMN_INDICES.PREVIOUS_YEAR_TOTAL
    ],
    [DATA_COLUMN_INDICES.PERCENT_CHANGE_DESKTOP]: [
        DATA_COLUMN_INDICES.PERCENT_CHANGE_DESKTOP - DATA_COLUMN_INDICES.CURRENT_YEAR_DESKTOP,
        DATA_COLUMN_INDICES.PERCENT_CHANGE_DESKTOP - DATA_COLUMN_INDICES.PREVIOUS_YEAR_DESKTOP
    ],
    [DATA_COLUMN_INDICES.PERCENT_CHANGE_MOBILE]: [
        DATA_COLUMN_INDICES.PERCENT_CHANGE_MOBILE - DATA_COLUMN_INDICES.CURRENT_YEAR_MOBILE,
        DATA_COLUMN_INDICES.PERCENT_CHANGE_MOBILE - DATA_COLUMN_INDICES.PREVIOUS_YEAR_MOBILE
    ],
    [DATA_COLUMN_INDICES.PERCENT_CHANGE_TABLET]: [
        DATA_COLUMN_INDICES.PERCENT_CHANGE_TABLET - DATA_COLUMN_INDICES.CURRENT_YEAR_TABLET,
        DATA_COLUMN_INDICES.PERCENT_CHANGE_TABLET - DATA_COLUMN_INDICES.PREVIOUS_YEAR_TABLET
    ],
  };


  // Iterate over row categories that contain calculable data (e.g., Unique Users, Visits)
  // ROW_CATEGORIES.UNIQUE_USERS is 2. table.length - 1 excludes the last "Field Type" row.
  for (let rowCategoryIdx = ROW_CATEGORIES.UNIQUE_USERS; rowCategoryIdx < table.length - 1; rowCategoryIdx++) {
    // Calculate sums for "Total" columns (CURRENT_YEAR_TOTAL, PREVIOUS_YEAR_TOTAL)
    // These are sums of their respective device data.
    // Example: CURRENT_YEAR_TOTAL = CURRENT_YEAR_DESKTOP + CURRENT_YEAR_MOBILE + CURRENT_YEAR_TABLET

    // Sum for CURRENT_YEAR_TOTAL
    table[rowCategoryIdx][DATA_COLUMN_INDICES.CURRENT_YEAR_TOTAL] =
      table[rowCategoryIdx].slice(DATA_COLUMN_INDICES.CURRENT_YEAR_DESKTOP, DATA_COLUMN_INDICES.CURRENT_YEAR_TABLET + 1)
      .reduce((partialSum, a) => partialSum + a, 0);

    // Sum for PREVIOUS_YEAR_TOTAL
    table[rowCategoryIdx][DATA_COLUMN_INDICES.PREVIOUS_YEAR_TOTAL] =
      table[rowCategoryIdx].slice(DATA_COLUMN_INDICES.PREVIOUS_YEAR_DESKTOP, DATA_COLUMN_INDICES.PREVIOUS_YEAR_TABLET + 1)
      .reduce((partialSum, a) => partialSum + a, 0);

    // Calculate percentage changes
    for (const changeColIdx of percentChangeColumnIndices) {
        const offsets = percentChangeOffsets[changeColIdx];
        if (!offsets) continue; // Should not happen if percentChangeOffsets is comprehensive

        const currentDataIdx = changeColIdx - offsets[0];
        const previousDataIdx = changeColIdx - offsets[1];

        const dataCurrent = table[rowCategoryIdx][currentDataIdx];
        const dataPrevious = table[rowCategoryIdx][previousDataIdx];

        if (dataPrevious !== 0 && !isNaN(dataCurrent) && !isNaN(dataPrevious)) {
            const perc = Number(((dataCurrent / dataPrevious - 1) * 100).toFixed(2));
            table[rowCategoryIdx][changeColIdx] = perc;
        } else {
            table[rowCategoryIdx][changeColIdx] = 0; // Or some other indicator for invalid calc
        }
    }
  }

  // Calculate "Pageviews/Visit"
  // Pageviews/Visit = Pageviews / Visits
  // This calculation is done for all data columns (Total Current, Total Previous, Desktop Current, etc.)
  const visitsRow = table[ROW_CATEGORIES.VISITS];
  const pageviewsRow = table[ROW_CATEGORIES.PAGEVIEWS];
  const pvPerRow = table[ROW_CATEGORIES.PAGEVIEWS_PER_VISIT];

  // Iterate through all relevant data column indices (excluding labels, blanks, and percent changes initially)
  const calculableDataColumns = [
      DATA_COLUMN_INDICES.CURRENT_YEAR_TOTAL, DATA_COLUMN_INDICES.PREVIOUS_YEAR_TOTAL,
      DATA_COLUMN_INDICES.CURRENT_YEAR_DESKTOP, DATA_COLUMN_INDICES.CURRENT_YEAR_MOBILE, DATA_COLUMN_INDICES.CURRENT_YEAR_TABLET,
      DATA_COLUMN_INDICES.PREVIOUS_YEAR_DESKTOP, DATA_COLUMN_INDICES.PREVIOUS_YEAR_MOBILE, DATA_COLUMN_INDICES.PREVIOUS_YEAR_TABLET,
  ];

  for (const dataColIdx of calculableDataColumns) {
    if (visitsRow[dataColIdx] !== 0 && !isNaN(visitsRow[dataColIdx]) && !isNaN(pageviewsRow[dataColIdx])) {
      pvPerRow[dataColIdx] = Number((pageviewsRow[dataColIdx] / visitsRow[dataColIdx]).toFixed(2));
    } else {
      pvPerRow[dataColIdx] = 0; // Avoid division by zero
    }
  }

  // Nachträgliche Anpassung der prozentualen Veränderung
  // In der Spalte "Pageviews/Visit" (ROW_CATEGORIES.PAGEVIEWS_PER_VISIT)
  // This recalculates the percent changes specifically for the Pageviews/Visit row,
  // as its base values (CURRENT_YEAR_TOTAL, PREVIOUS_YEAR_TOTAL etc.) have just been calculated.
  for (const changeColIdx of percentChangeColumnIndices) {
    const offsets = percentChangeOffsets[changeColIdx];
    if (!offsets) continue;

    const currentPvPerDataIdx = changeColIdx - offsets[0];
    const previousPvPerDataIdx = changeColIdx - offsets[1];

    const currentPVperVisit = pvPerRow[currentPvPerDataIdx];
    const previousPVperVisit = pvPerRow[previousPvPerDataIdx];

    if (previousPVperVisit !== 0 && !isNaN(currentPVperVisit) && !isNaN(previousPVperVisit)) {
        const perc = Number(((currentPVperVisit / previousPVperVisit - 1) * 100).toFixed(2));
        pvPerRow[changeColIdx] = perc;
    } else {
        pvPerRow[changeColIdx] = 0;
    }
  }

  return table;
}

const allMonthlyData = [];
const d = new Date();
let currentMonthIndex = d.getMonth();
let currentFullYear = d.getFullYear();

for (let i = 0; i < 3; i++) {
  let targetMonth = currentMonthIndex - i;
  let targetYear = currentFullYear;
  if (targetMonth < 0) {
    targetMonth += 12; // Wrap around to the previous year
    targetYear -= 1;
  }
  // The data should be in order: current month - 2, current month - 1, current month
  // So we unshift to add to the beginning of the array
  allMonthlyData.unshift(generateTableData(targetMonth, targetYear));
}

fs.writeFileSync(
  `generated-monthly-data.json`,
  JSON.stringify(allMonthlyData),
);
console.log("Done");
