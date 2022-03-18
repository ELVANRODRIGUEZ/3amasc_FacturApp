// ===================================================================== XMLAPI and DOMParser

var fileCounter = 0;
var filesSelected = 0;
var doneWithFiles = false;
var filesOrigin = "";
var recFiles = null;
var satFiles = null;
var satRecords = null;
var recRecords = null;
var singleInvoice = [];
var SATinvoiceIDs = [];
var RECinvoiceIDs = [];
var unmSatInvoiceIDs = [];
var unmRecInvoiceIDs = [];
var dataInSATandREC = false;
var dataInREC = false;

// ---------------- Window Listener to grab desired elements.
window.addEventListener("load", grabElements, false);

// ---------------- Grab elements we will work with.
function grabElements() {

  // dataArea = document.getElementById("dataHolder");
  satFiles = document.getElementById("satFiles");
  // satFiles.addEventListener("click", readFiles("sat"));

  recFiles = document.getElementById("recFiles");
  // recFiles.addEventListener("click", readFiles("rec"));
  
  satRecords = document.getElementById("satTableBody");
  recRecords = document.getElementById("recTableBody");

}

// ---------------- Add event listeners to grabbed elements.
function readFiles(fileOrigin) {

  satFiles.addEventListener("change", process, false);
  recFiles.addEventListener("change", process, false);

}

// ---------------- Prepare selected files for parsing and send trigger the function(s) to scan them iteratively.
function process(element) {

  var trigger = $(element.target).attr("id");

  if (trigger == "satFiles") {

    filesOrigin = "#satTableBody"

  } else if (trigger == "recFiles") {

    filesOrigin = "#recTableBody"

  }
  
  // Assign "files" the selected file(s) in the input file selector.
  var selection = element.target.files;
  // Since "element.target.files" returns an array, we will choose the first one of its elements.
  files = Object.entries(selection);

  // console.log(files[0][1].name);

  evaluateFiles(files, evalRegistries);

}

function evaluateFiles(files, callback){

  var i = 0;

  files.forEach(file => {

    // console.log(file)
    
    // Reset "fileCounter".
    if (i == 0){
      
      fileCounter = 0;
      
    }
    
    // The "FileReader" type assigned to a variable creates the object for subsequent usage.
    var Reader = new FileReader();
    
    // Once created, the "FileReader" object named "Reader" will read "as text" whatever file was chosen.
    // console.log(Reader);
    var testPromise = new Promise ((res, rej) => {
      // console.log(Reader);
      // console.log(fileObject[i]);
      Reader.readAsText(file[1]);

      Reader.onload = (e) => {
        let  plainText= e.target.result
        res(findXMLElements(plainText,file[1].name));

      }
      
    })
    // We'll add an event listener for "load" action to the Reader object to call the "broadcast" function.
    testPromise.then((e) => {
      // console.log(e);
      if (filesOrigin == "#satTableBody") {

        SATinvoiceIDs.push(e);
    
        // Change the value of "TOTAL DE REGISTROS" row.
        $("#Reg-SAT")
        .val(SATinvoiceIDs.length)
        .html(SATinvoiceIDs.length)
        
        $("#Reg-SAT-line").css({"visibility": "visible"});
          
      }else if (filesOrigin == "#recTableBody") {
          
        RECinvoiceIDs.push(e);
    
        // Change the value of "TOTAL DE REGISTROS" row.
        $("#Reg-REC")
        .val(RECinvoiceIDs.length)
        .html(RECinvoiceIDs.length)
        
        $("#Reg-REC-line").css({"visibility": "visible"});
    
      }
      i++;

      // Check if we are done looping through the selected files.
      if (i == Object.keys(files).length){

        doneWithFiles = true;
        callback(SATinvoiceIDs, RECinvoiceIDs);

      }
        
    })

  })
    
}

function evalRegistries(a, b){

  // console.log("in! " + a.length);
  // console.log("in! " + b.length);

  if(a.length > 0 && b.length > 0){
    
    var evalPromise = new Promise((res,rej) => {

      res(comSATvsREC(a,b,"#satTableBody tr"));

    })

    evalPromise.then(()=>{
      
      comSATvsREC(b,a,"#recTableBody tr");

    }).then(() => {
      
      // console.log(unmSatInvoiceIDs.length)
      // console.log(unmRecInvoiceIDs.length)

      $("#Reg-SATmatch")
        .val(unmSatInvoiceIDs.length)
        .html(unmSatInvoiceIDs.length)
        
      $("#Reg-SATmatch-line").css({"visibility": "visible"});
      
      $("#Reg-RECmatch")
        .val(unmRecInvoiceIDs.length)
        .html(unmRecInvoiceIDs.length)
        
      $("#Reg-RECmatch-line").css({"visibility": "visible"});

    })
  }

}

// ---------------- Parse, read and retrieve 'xml' content.
function findXMLElements(element,fileName) {

  var response;
  var parser;
  var xmlDoc2;

  var tagEmisor;
  var tagReceptor;
  var rfcEmisor;
  var rfcReceptor;
  var nombreEmisor;
  var tagTimbre;
  var claveCFDI;
  var tagComprobante;
  var fecha;
  var totalComprobante;

  var impTagPresent;
  var rigthImpTag;
  var totalImpTrasImpuestos;
  var tagImpuestosTras;
  var impuestosTrasCount;
  var totalIVA;

  // By passing the argument "element" (this name could be any name) to the function, we are capturing the element that called this function, which was the "Reader object" created in the "process" function. 
  // in this variable, we are storing the raw invoice which we will later parse in order to extract the invoice information.
  // response = element.target.result;
  response = element;

  // Creating a new "DOMParser" object by assigning the "DOMParser" type to a variable.
  parser = new DOMParser();
  // Assign the parsed result, which swaped the text content of "response" for an XML structured object.

  //console.log(response);
  
  //We create the parsed document from which we can actually read all the invoice data.
  xmlDoc2 = parser.parseFromString(response, "text/xml");
  //console.log(xmlDoc2);

  // ---------------- "nombre" and "rfc" of invoice emmiter. 
  // We'll search for the "cfdi:Emisor" through the "getElementsByTagName" method which retrieves an array, so we will take the first one of its elements.
  tagEmisor = xmlDoc2.getElementsByTagName("cfdi:Emisor")[0];
  // The following searches will take place only if there actually was a "cfdi:Emisor" tag. If there was, the following attributes will be searched within it.
  if (tagEmisor != undefined) {
    // This if checks the spelling for the "RFC" attribute. Former invoices had a different sepelling from what they have today.
    rfcEmisor = tagEmisor.getAttribute("rfc") || tagEmisor.getAttribute("Rfc");

    // This gets "nombre" tag value. Former invoices had a different sepelling from what they have today.
    nombreEmisor = tagEmisor.getAttribute("nombre") || tagEmisor.getAttribute("Nombre");

  }

  // ---------------- "rfc" of invoice reciever. 
  // We'll search for the "cfdi:Emisor" through the "getElementsByTagName" method which retrieves an array, so we will take the first one of its elements.
  tagReceptor = xmlDoc2.getElementsByTagName("cfdi:Receptor")[0];
  // The following searches will take place only if there actually was a "cfdi:Emisor" tag. If there was, the following attributes will be searched within it.
  if (tagReceptor != undefined) {
    // This if checks the spelling for the "RFC" attribute. Former invoices had a different sepelling from what they have today.
    rfcReceptor = tagReceptor.getAttribute("rfc") || tagReceptor.getAttribute("Rfc");

  }

  // ---------------- "UUID" invoice key. 
  tagTimbre = xmlDoc2.getElementsByTagName("tfd:TimbreFiscalDigital")[0];

  claveCFDI = tagTimbre.getAttribute("UUID");

  // ---------------- "fecha" and "total de comprobante". 
  // We'll search for the "cfdi:Comprobante" through the "getElementsByTagName" method which retrieves an array, so we will take the first one of its elements.
  tagComprobante = xmlDoc2.getElementsByTagName("cfdi:Comprobante")[0];

  fecha = tagComprobante.getAttribute("Fecha") ||
    tagComprobante.getAttribute("fecha");

  totalComprobante = tagComprobante.getAttribute("total") ||
    tagComprobante.getAttribute("Total");

  impTagPresent = xmlDoc2.getElementsByTagName("cfdi:Impuestos").length;

  rigthImpTag = xmlDoc2.getElementsByTagName("cfdi:Impuestos")[impTagPresent - 1];

  //console.log(rigthImpTag);
  if (rigthImpTag != undefined) {
    totalImpTrasImpuestos = rigthImpTag.getAttribute("totalImpuestosTrasladados") ||
      rigthImpTag.getAttribute("TotalImpuestosTrasladados");

    tagImpuestosTras = rigthImpTag.getElementsByTagName("cfdi:Traslados")[0];

    if (tagImpuestosTras != undefined) {
      impuestosTrasCount = tagImpuestosTras.children.length;

      totalIVA = 0;

      for (var i = 0; i < impuestosTrasCount; i++) {
        var impTipo;
        var impTrasladadoImp;
        var impTrasladado;

        impTrasladado = tagImpuestosTras.getElementsByTagName("cfdi:Traslado")[
          i
        ];
        impTipo = impTrasladado.getAttribute("Impuesto");
        impTrasladadoImp = parseFloat(impTrasladado.getAttribute("Importe"));

        if (!impTipo) {
          impTipo = impTrasladado.getAttribute("impuesto");
        }
        if (!impTrasladadoImp) {
          impTrasladadoImp = parseFloat(impTrasladado.getAttribute("importe"));
        }

        if (impTipo == "002" || impTipo == "IVA") {
          totalIVA = totalIVA + impTrasladadoImp;
        }
      }

      if (totalIVA > totalImpTrasImpuestos) {
        totalIVA = totalImpTrasImpuestos;
      }
    } else {
      totalIVA = parseFloat(0);
    }

  } else {
    // This is just in case "cfdi:impuestos" is not present.
    totalIVA = parseFloat(0);

  }

  // Create CFDI array containing its main fields.
  singleInvoice = [fileName,nombreEmisor,rfcEmisor,
    formatTime(fecha),claveCFDI,
    formatCurrency(totalComprobante),
    formatCurrency(totalIVA),rfcReceptor]  

  addInvoice(fileName,nombreEmisor,rfcEmisor,fecha,claveCFDI,totalComprobante,totalIVA,rfcReceptor)  

  return(singleInvoice);

}

// ---------------- Append invoice info in the table and populate the corresponding array with the proper invoice info.
function addInvoice(archivo,nombre,rfcE,fecha,clave,total,IVA,rfcR){
  
  $(filesOrigin).append(
    "<tr id='rowNumber" + fileCounter + 
    "' numDeLista=" + fileCounter +  
    " archivo='" + archivo +  
    "' nombreEmisor='" + nombre +  
    "' rfcEmisor='" + rfcE +  
    "' rfcReceptor='" + rfcR +  
    "' fecha='" + formatTime(fecha) +  
    "' claveCFDI='" + clave +
    "' total='" + formatCurrency(total) +  
    "' IVA='" + formatCurrency(IVA) +  
    "'>" +
    "<td>" +
    archivo +
    "</td>" +
    "<td>" +
    nombre +
    "</td>" +
    "<td>" +
    rfcE +
    "</td>" +
    "<td>" +
    formatTime(fecha) +
    "</td>" +
    "<td>" +
    clave +
    "</td>" +
    "<td>" +
    formatCurrency(total) +
    "</td>" +
    "<td>" +
    formatCurrency(IVA) +
    "</td>" +
    "<td>" +
    rfcR +
    "</td>" +
    "</tr>"
  );

  fileCounter++; 

}

// ========================================== CALLBACKS


function comSATvsREC(a,b,table) {

  if(table === "#satTableBody tr"){

    unmSatInvoiceIDs = [];
    
  }else{
    
    unmRecInvoiceIDs = [];

  }
  
  var i;
  var j;
  
  // console.log(SATinvoiceIDs.length);
  // console.log(RECinvoiceIDs.length);

  for(i=0; i<a.length; i++){

    for(j=0; j<b.length; j++){

      // console.log("Del SAT " + a[i][3]);
      // console.log("Del REC " + b[j][3]);
      if(a[i][4] == b[j][4]){
        //console.log(a[i][3] +" igual a "+ b[j][3]);
        break;
        
      }else{
        if (j == (b.length - 1)){
          //console.log(a[i][3] +" no igual a "+ b[j][3]);
          
          if(table === "#satTableBody tr"){

            unmSatInvoiceIDs.push({arc:a[i][0],pro:a[i][1],rfE:a[i][2],fec:a[i][3],fof:a[i][4],tot:a[i][5],iva:a[i][6],rfR:a[i][7]});

          }else{

            unmRecInvoiceIDs.push({arc:a[i][0],pro:a[i][1],rfE:a[i][2],fec:a[i][3],fof:a[i][4],tot:a[i][5],iva:a[i][6],rfR:a[i][7]});

          }
        
        }
      }

    }
    
  }

  if(table === "#satTableBody tr"){

    paintUnmatch(unmSatInvoiceIDs, table);
    
  }else{
    
    paintUnmatch(unmRecInvoiceIDs, table);

  }

};

// ========================================== FORMATS

// ---------------- Format to Currency.
function formatCurrency(number) {
  number = numeral(number).format("$0,0.00");
  return number;
}

// ---------------- Format to Date.
function formatTime(time) {
  time = moment(time).format("MM/DD/YYYY");
  return time;
}

// ---------------- Paint unmatched CFDI's.
function paintUnmatch(list, reg){

  var paintPromise = new Promise ((res) => {

    $(reg).each(function() {
      
      $(this).css("background-color","white");
      
    })

    res("done");

  })

  paintPromise.then(() => {

    var d;
    //console.log(list);
    list.forEach((e) => {

      // console.log(e)
      $(reg).each(function() {

        d = $(this).attr("claveCFDI");

        if(d == e["fof"]){
          
          // console.log(e[3]);
          // console.log(d);
          $(this).css("background-color","#e9ecef");

        }

      })

    }); 

  })

}

// ========================================== EXPORT TO EXCEL

// ---------------- Click event for "Registros SAT a Excel" button.
$("#genExclSAT").click(function () {

  // console.log(unmSatInvoiceIDs)
  // console.log(unmRecInvoiceIDs)

  // Create an Excel Workbook and assing it some properties.
  var wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "FacturasSat.xlsx",
    Subject: "Conciliacion de Facturas",
    Author: "ELR"
  }

  // This matrix will become our first sheet's headers.
  var rowHeaders1 = [
    ["FACTURAS REGISTRADAS EN SAT NO CONCILIADAS EN RECIBIDAS"],
    ["Nombre_de_archivo","Proveedor","RFC_Emisor","Fecha","Folio_Fiscal","Total","IVA","RFC_Emisor"]
  ];
  // This matrix will become our second sheet's headers.
  var rowHeaders2 = [
    ["FACTURAS RECIBIDAS NO REGISTRADAS EN SAT"],
    ["Nombre_de_archivo","Proveedor","RFC_Emisor","Fecha","Folio_Fiscal","Total","IVA","RFC_Emisor"]
  ];

  // We will use a Promise to assing both sheets in order and thus guarantee both of them get populated correctly.
  var fillPromise = new Promise((res, rec) => {

    // This creates a first Excel Sheet, and will add the headerse created before
    var ws1 = XLSX.utils.aoa_to_sheet(rowHeaders1);
    
    // This will add to the recently created sheet the unmatched SAT registries as a json object.
    XLSX.utils.sheet_add_json(ws1,unmSatInvoiceIDs, {
      header:["arc","pro","rfE","fec","fof","tot","iva","rfR"],
      skipHeader:true,
      origin:"A3"
    });
    
    // This will add the already filled first sheet to the above creted workbook.
    XLSX.utils.book_append_sheet(wb, ws1, "FacSAT_SinConciliar");
    
    res("Done");
    
  })
  
  // "then" statement to append our second worksheet.
  fillPromise.then((e) => {

    // This creates a second Excel Sheet, and will add the same headerse created before.
    var ws2 = XLSX.utils.aoa_to_sheet(rowHeaders2);

    // This will add to the recently created second sheet the unmatched REC registries as a json object.
    XLSX.utils.sheet_add_json(ws2,unmRecInvoiceIDs, {
      header:["arc","pro","rfE","fec","fof","tot","iva","rfR"],
      skipHeader:true,
      origin:"A3"
    });
    
    // This will add the already filled second sheet to the above creted workbook.
    XLSX.utils.book_append_sheet(wb, ws2, "FacREC_SinConciliar");
    
  }).then(() => {
    
    // This creates a binary file thaty can be later on save in "xlsx" formtat.
    var wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    
    // This actually saves our binary file as an Excel file.
    saveAs(new Blob([wbout],{type:"application/octet-stream"}), "Conciliacion_FactSAT.xlsx");
  
  })

});

