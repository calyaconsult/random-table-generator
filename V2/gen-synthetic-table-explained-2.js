const fs = require('fs');
const syntheticData = JSON.parse(fs.readFileSync('sample.json'));
/* The data has the following structure.
   Each object represents one row of the original CSV data
[{
  Date: '*',
  Users: 62,
  Sessions: 78,
  Pageviews: 633,
  'Pages / Session': 8.634899903314016,
  'Avg. Time on Page': 21.534770174881523,
  'Avg. Session Duration': 150.95592643398822
}, ...]
*/
const colNames = Object.keys(syntheticData[0]);
const colsWithAverages = colNames.filter(x => x.match(/^Avg/));

/* We select the first object and extract the keys. All other objects in syntheticData have the same keys
[
  'Date',
  'Users',
  'Sessions',
  'Pageviews',
  'Pages / Session',
  'Avg. Time on Page',
  'Avg. Session Duration'
]
*/
//console.log(colNames);

/* We set a few constants */
const year = 2022;
const prevYear = year-1;
const month = 12;
const monthnames = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",");
const groupMembers = "desktop,mobile,tablet".split(",");
const groupNames = ['currentYear','previousYear'];
const numberOfGroupMembers = groupMembers.length;
const numberOfGroups = 2;
/*
   Groups: those are the row groups we want to see in the table we are going to create from the output of this script
   The groups we will be using here are `current year` and `previous year`
   See https://random-table-generator-a-html.michaelglunz.repl.co/
*/

const createAccu = (template) => {
  const accu = JSON.parse(JSON.stringify(template));
  for (let i=0;i<Object.keys(template).length;i++) {
    accu[Object.keys(template)[i]] = 0;
  };
  return accu;
};
//console.log(createAccu(syntheticData[0]),syntheticData[0]);
/*
  The function createAccu takes one Object from syntheticData and creates a new object with the same structure but sets all values to 0 
*/

const createAccuAlt = (keyList) => {
  const accu = {};
  for (let i=0;i<keyList.length;i++) {
    accu[keyList[i]] = 0;
  };
  return accu;
};
//console.log(createAccuAlt(colNames),syntheticData[0]);
/*
  The function createAccuAlt does the same in a different way 
*/

const calcRatio = (x,y,z) => {
  return(isNaN(x) || isNaN(y) || y == 0) ? z : x/y; 
};
//console.log(calcRatio(1,"a",3))
/* 
  The function will be needed for calculating the ratio of "Pages per Session".
  This is because the field 'Pages / Session' of syntheticData does not correspond to the actual ratio of 'Pageviews'/'Sessions'
  and thus needs to be calculated here.
  The input consists of 'Pageviews','Sessions', and 'Pages / Session'. If either 'Pageviews' or 'Sessions' are NaN or 'Sessions' equals 0
  the value for 'Pages / Session' will be returned without calculationg the real ratio.
*/

const getDelta = (x,y) => {
  if (isNaN(x) || isNaN(y)) return null;
  return ((x/y-1)*100).toFixed(2);
};

const calcDeltas = (k,x,y) => {
  let deltas =  x.map((e, i) => { return Number(getDelta(x[i],y[i]));});
  const obj =  k.reduce((ac, element, index) => {
     return {...ac, [element]: deltas[index]};
  }, {});
  return obj;
};
/*
   The function calcDeltas takes as input params an array of keys ('k') and two arrays of values ('x' and 'y');
   Example:
      console.log(calcDeltas(['a','b','c'],[1,4,9],[1,2,3])) => { a: 0, b: 100, c: 200 }
      console.log(calcDeltas(['a','b','c'],[1,2,3],[1,4,9])) => { a: 0, b: -50, c: -66.67 }
*/

/* Copying data from syntheticData, replacing inaccurate ratios, adding dates, and accumulating row values for each column of each group */
var synthVals = {};
var accumulator;

for (let rs=0;rs<numberOfGroupMembers*numberOfGroups;rs++) {
  /* rs is the row counter
     We create one row for each meber of each group
     E.g., if we have two groups with three members each we get 6 rows
  */
  let positionInGroup = rs%numberOfGroupMembers;
  let groupMember = groupMembers[positionInGroup];
  let groupNumber = Math.floor(rs/numberOfGroupMembers);
  let currentGroup = groupNames[groupNumber];
  // console.log(`Row: ${rs}, Position in Group: ${positionInGroup}, Group #: ${groupNumber}, Group Member: ${groupMember}, Group: ${currentGroup}`);
  if (positionInGroup == 0)  {
     /* 
        positionInGroup == 0 indicates that we are entering a new group
        As soon that this happens we create a new 'Data' object in synthVals.
     */
     synthVals[currentGroup] = {"Data" : {}};
     accumulator = createAccu(syntheticData[0]);
  };
  /* Get row data */
  let randomIndex = Math.floor(Math.random()*syntheticData.length);
  let row = syntheticData[randomIndex];
  /*
     We choose one row at random from syntheticData
  */
  row["Pages / Session"] = calcRatio(row["Pageviews"],row["Sessions"],row["Pages / Session"]);
  /*
     We replace the 'Pages / Session' value with the calculated one (see explanation above)
  */
  row["Date"] = (currentGroup == 'currentYear') ? `${month} ${year}` : `${month} ${prevYear}`;
  accumulator["Date"] = row["Date"];
  synthVals[currentGroup]["Data"][groupMember] = row;
  for (let i=0;i<Object.keys(accumulator).length;i++) {
    let cellName = Object.keys(accumulator)[i];
    if (isNaN(accumulator[cellName])) {
      // Skip if cell has non-numeric content, such as '1 2021'
    } else {
      accumulator[cellName] += row[cellName];
      // If cell content is numeric we accumulate
    };
  };
  synthVals[currentGroup]["Group Total"] = JSON.parse(JSON.stringify(accumulator));
  /*
    We insert a copy of 'accumulator' in synthVals[group]
    Then we are done with accumulating the group values
  */
};
/* END Copying data from syntheticData, replacing inaccurate ratios, adding dates, and accumulating row values for each column of each group */
/*
   We now need to adjust the ratio in the group totals because x1/y1 + x2/y2 + x3/y3 is not equal to (x1+x2+x3) / (y1+y2+y3)
*/
for (let g=0;g<groupNames.length;g++) {
  const group = groupNames[g];
  if (typeof synthVals[group]["Group Total"] != "undefined") {
    synthVals[group]["Group Total"]["Pages / Session"] = 
      calcRatio(synthVals[group]["Group Total"]["Pageviews"],
                synthVals[group]["Group Total"]["Sessions"],
                synthVals[group]["Group Total"]["Pages / Session"]
               );
  };
  /* 
    Select columns with averages and divide the accumulated value by numberOfGroupMembers.
  */
  for (let c=0;c<colsWithAverages.length;c++) {
    const colName = colsWithAverages[c];
    for (let g=0;g<groupNames.length;g++) {
      const group = groupNames[g];
      synthVals[group]["Group Total"][colName] = synthVals[group]["Group Total"][colName]/numberOfGroupMembers
      //console.log(group,colName,synthVals[group]["Group Total"][colName],synthVals[group]["Group Total"][colName]/numberOfGroupMembers);
    }
  }
  
};
/*
   Inspect the resulting object wit console.log(JSON.stringify(synthVals,null,2));
*/

// Calculate deltas for the groups
synthVals["Deltas"] = {};
for (let gm=0;gm<numberOfGroupMembers;gm++) {
  let currentMember = groupMembers[gm];
  //console.log(groupMembers[gm]);
  let n = Object.keys(synthVals["currentYear"]["Data"][currentMember]);
  let a = Object.values(synthVals["currentYear"]["Data"][currentMember]);
  let b = Object.values(synthVals["previousYear"]["Data"][currentMember]);
  //console.log(calcDeltas(n,a,b),"\n");
  synthVals["Deltas"][groupMembers[gm]] = calcDeltas(n,a,b);
}
let n = Object.keys(synthVals["currentYear"]["Group Total"]);
let a = Object.values(synthVals["currentYear"]["Group Total"]);
let b = Object.values(synthVals["previousYear"]["Group Total"]);
//console.log("Delta Total");
//console.log(calcDeltas(n,a,b),"\n");
synthVals["Deltas"]["Grand Total"] = calcDeltas(n,a,b);

console.log(JSON.stringify(synthVals,null,2));