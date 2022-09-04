const mkCell = (x, type, row, column) => {
  let cellClass = (isNaN(x)) ? 'nan' : 'numeric';
  if ((row == 4 || row >= 13) && column > 2) cellClass = cellClass + ' calc';
  let cellContent = (type == 'td') ? fillCell(x, row) : x;
  return `<${type} data-cellcontent="${x}" class="${cellClass}" id="r${row}c${column}">${cellContent}</${type}>`
};

const fillCell = (x) => { 
  console.log("FC",x);
  return (isNaN(x) || Number.isInteger(x)) ? x : x.toFixed(2);
};

const chainCells = (t, r) => {
  const colCounter = counter(0);
  return (newRow, x) => { return newRow + mkCell(x, t, r, colCounter()) };
};

const counter = (init) => {
  var i = init;
  return () => {
    i += 1;
    return i;
  }
};

const colCounter = counter(-1);

const mkRow = (arr, type) => {
  let rn = colCounter();
  let dummy = [''];
  let rowClass = 'none';
  
  switch (arr[0]) {
    case "Veränderung": rowClass = 'rc-v'; break;
    case "{BLANK}": rowClass = 'rc-b'; break;
    default: rowClass = 'rc-d'; break;
  }
  
  return `<tr class="${rowClass}" id="row-${rn}"><${type} class="rownr">${rn}</${type}>${[...dummy, ...arr].reduce(chainCells(type, rn))}</tr>`; // [...[''],...arr] ist äquivalent zu arr.unshift('dummy'); arr
};

var monthName = "Nov";
var month = "Aug,Sep,Oct,Nov,Dec".split(",").indexOf(monthName);

$("document").ready(function() {
  $.getJSON("output.json", function(allData) {
    var data = allData;
    //console.log(data);
    let c = counter(0);
    $("#maintable > thead").append(mkRow(Array(8).fill(1).map((x)=>{return c()}),"th"));
    $("#maintable > thead").append(mkRow(["What",...Object.keys(data["currentYear"]["Group Total"])],"th"));
    const dataSections = ["currentYear","previousYear"];
    for (let i=0;i<2;i++) {
      for (let item in data[dataSections[i]]["Data"]) {
        $("#maintable > tbody").append(mkRow([item,...Object.values(data[dataSections[i]]["Data"][item])],"td"));
      };
      $("#maintable > tbody").append(mkRow(["Total",...Object.values(data[dataSections[i]]["Group Total"])],"td"));
    };
    for (let delta in data["Deltas"]) {
      let myRow = Object.values(data["Deltas"][delta]);
      $("#maintable > tbody").append(mkRow(["Δ %",delta,...myRow.slice(1,myRow.length)],"td"));
    };
  }).then(function() {
    $("#maintable > thead > tr:nth-child(1) > th").each(function() {$(this).addClass("colnr")});
    $("#maintable > tbody > tr > td.numeric").each(function() {if (Number($(this).text())<0) $(this).addClass("warn"); if ($(this).parent().attr("class")=="rc-v" && Number($(this).text())>100) $(this).addClass("exorb")});
  });
});
