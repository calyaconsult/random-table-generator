const mkCell = (x, type, row, column) => {
  let cellClass = (isNaN(x)) ? 'nan' : 'numeric';
  if ((row == 3 || row >= 13) && column > 2) cellClass = cellClass + ' calc';
  let cellContent = (type == 'td') ? fillCell(x, row) : x;
  return `<${type} data-cellcontent="${x}" class="${cellClass}" id="r${row}c${column}">${cellContent}</${type}>`
};

const fillCell = (x) => { return x; };

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
  $.getJSON("months-generated-values.json", function(allData) {
    var data = allData[month];
    let c = counter(0);
    $("#maintable > thead").append(mkRow(Array(11).fill(1).map((x)=>{return c()}),"th"));
    
    const rows = data.length;
    var matrix = [];
    var rotatedMatrix = [];
    for (let dataRow = 0; dataRow < rows; dataRow++) {
      matrix.push(data[dataRow].flat());
    };
    for (let r=0;r<matrix[0].length;r++) {
      let row = [];
      for (let c=0;c<matrix.length;c++) {
        row.push(matrix[c][r]);
      }
      rotatedMatrix.push(row);
      if (r==0) {
        $("#maintable > thead").append(mkRow(row,"th"));
      } else {
        if (row[0]=="{BLANK}") row = row.map((x)=>{return '&nbsp;'});
        $("#maintable > tbody").append(mkRow(row,"td"));
      }
    }
    console.log(rotatedMatrix)
      //;
  }).then(function() {
    $("#maintable > thead > tr:nth-child(1) > th").each(function() {$(this).addClass("colnr")});
    /* Workaround, weil das Node-Script noch nicht angepasst ist
    $("#r2c6").html(Number($("#r2c6").html()).toFixed(2));
    $("#r3c6").html(Number($("#r3c6").html()).toFixed(2));
    */
  });
});