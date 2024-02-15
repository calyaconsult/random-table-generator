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
const d = new Date();
var myMonth; // = 'September';
var myYear; // = '2019';
const month = myMonth || monthnames[d.getMonth()];
const currentYear = myYear || d.getYear() + 1900;
const previousYear = currentYear - 1;
var groups = ["total", "devices"];
var groupNames = groups;
var devices = ["desktop", "mobile", "tablet"];
var columns = [
  "Monat",
  "Monat Text",
  "Unique Users",
  "Visits",
  "Pageviews",
  "Pageviews/Visit",
  "Avg. Time on Page",
  "Avg. Session Duration",
  "Avg. Read Time",
  "Use Time",
  "Field Type",
];
var types = [
  "string",
  "string",
  "int",
  "int",
  "int",
  "float(2)",
  "float(2)",
  "float(2)",
  "hms",
  "hms",
  "string",
];

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

const fillWithRandVals = (a) => {
  var arr = a;
  return () => {
    if (!Array.isArray(arr)) return arr;
    return arr.map((x) => {
      return Math.floor(Math.random() * 1000);
    });
  };
};

// Erstellen einer Tabelle mit n Spalten und m Zeilem
// Die Spalten sind Arrays, die Verschachtelungsebene 1 des Tabellen-Arrays bilden
// "Tabelle" = Array of "Spalte"
// "Spalte"  = Array of ("Zahl", "String")
// Eine Zeile m ergibt sich aus dem jeweils m. Element einer Spalte

var rowsInner;
var table = [
  [
    columns[0],
    currentYear,
    previousYear,
    "Veränderung",
    "{BLANK}",
    ...Array(3).fill(currentYear),
    "{BLANK}",
    ...Array(3).fill(previousYear),
    "{BLANK}",
    ...Array(3).fill("Veränderung"),
  ],
];

for (let c = 1; c < columns.length - 1; c++) {
  for (let g = 0; g < groups.length; g++) {
    switch (groups[g]) {
      case "total":
        if (c >= 2) {
          // Die Bedingung c >= 2 scheidet die ersten beiden von den übrigen Spalten; in unserer Tabelle befinden sich in Spalte 1 und 2 Beschriftungen, in den übrigen Spalten die Daten
          rowsInner = [columns[c], Array(3).fill("calc"), "{BLANK}"];
          break;
        } else {
          rowsInner = [
            columns[c],
            `${month} ${currentYear}`,
            `${month} ${previousYear}`,
            "Total",
            "{BLANK}",
          ];
          break;
        }
      case "devices":
        if (c >= 2) {
          rowsInner = [
            ...rowsInner,
            Array(3).fill("calc"),
            "{BLANK}",
            Array(3).fill("calc"),
            "{BLANK}",
            Array(3).fill("calc"),
          ];
          break;
        } else {
          rowsInner = [
            ...rowsInner,
            ...devices,
            "{BLANK}",
            ...devices,
            "{BLANK}",
            ...devices,
          ];
          break;
        }
      default:
    }
  }
  table.push(
    rowsInner
      .map((x) => {
        return fillWithRandVals(x)();
      })
      .flat(),
  );
}
table.push([
  table[0].map((x) => {
    // Als letztes wird eine Spalte angehängt, die Metainformationen zu den einzelnen Zeilen enthält
    switch (x) {
      case table[0][0]:
        return columns[columns.length - 1];
      case "{BLANK}":
        return "{BLANK}";
      case "Veränderung":
        return "calculated";
      default:
        return "generated";
    }
  }),
]);

//console.log(table);

// Die Tabelle enthält an diesem Punkt der Ausführung überall dort, wo Zahlenwerte erwartet werden, Zufallszahlen
// Im nächsten Schritt werden dortm wo vertikale Abhängigkeiten zwischen Zellen bestehen, diese aufgelöst
// Konkret heisst das: Zeilen 1 und 2 werden jeweils mit der Summe der Zeilen 5 bis 8 bzw. 9 bis 12 überschrieben
// Danach wird pro Gruppe die prozentuale Veränderung berechnet

//console.log(table);

var calcRows = table[0]
  .map((x, i) => {
    if (x == "Veränderung") return i;
  })
  .filter((x) => {
    return x;
  }); // Welche Zeilen nehmen berechnete Ergebnisse auf?

var offsets = [[2, 1], ...Array(3).fill([8, 4])];

for (let col = 2; col < table.length - 1; col++) {
  // Füllen der Total-Zeilen mit der Summe der Detailzeilen
  let distanceToDetail = 4; // Anzahl Zeilen zwischen erster Summezeile und erster Zeile der Details
  let numberOfDetails = 3; // Anzahl von Zeilen mit Detaildaten
  let offsetSumIndexPosition = 0; // Position der Zeile vor der ersten Summenzeile
  for (let i = 1; i < 3; i++) {
    let s1 = i + distanceToDetail + numberOfDetails * (i - 1);
    let s2 = i + distanceToDetail + numberOfDetails * i;
    table[col][i + offsetSumIndexPosition] = table[col]
      .slice(s1, s2)
      .reduce((partialSum, a) => partialSum + a, 0);
  }

  // Berechnung der prozentualen Veränderung
  for (let i = 0; i < calcRows.length; i++) {
    let cri = calcRows[i];
    let r1i = calcRows[i] - offsets[i][0];
    let r2i = calcRows[i] - offsets[i][1];
    let data1 = table[col][r1i];
    let data2 = table[col][r2i];
    //col,cri,r1i,r2i,
    let perc = Number(((data1 / data2 - 1) * 100).toFixed(2));
    //console.log(data1,data2,`${perc}%`);
    table[col][calcRows[i]] = perc;
  }
}

// Als letzter Schritt werden horizontale Abhängigkeinten aufgelöst.
// Im konkreten Beispiel wird in Spalte 6 der Quotient Spalte 5/Spalte 4 eingetragen

let h = [3, 4, 5];
for (let row = 1; row < 16; row++) {
  if (!isNaN(table[h[1]][row]))
    table[h[2]][row] = Number((table[h[1]][row] / table[h[0]][row]).toFixed(2));
}

// Nachträgliche Anpassung der prozentualen Veränderung
// In der Spalte "Pageviews/Visit"

table[5][3] = ((table[5][1] / table[5][2] - 1) * 100).toFixed(2);
table[5][13] = ((table[5][5] / table[5][9] - 1) * 100).toFixed(2);
table[5][14] = ((table[5][6] / table[5][10] - 1) * 100).toFixed(2);
table[5][15] = ((table[5][7] / table[5][11] - 1) * 100).toFixed(2);

let lfnr = 4;
fs.writeFileSync(`table-data-${lfnr}.json`, JSON.stringify(table));
console.log("Done");
