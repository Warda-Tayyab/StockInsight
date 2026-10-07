export const printReceipt = (elementId = "receipt-print-area") => {
  const content = document.getElementById(elementId);

  if (!content) {
    console.error("Receipt not found");
    return;
  }

  const printWindow = window.open(
    "",
    "",
    "width=400,height=600"
  );

  printWindow.document.write(`
    <html>
    <head>

    <title>Receipt</title>

    <style>

    @page {
      size: 80mm auto;
      margin: 0;
    }

    body {
      width: 80mm;
      margin:0;
      padding:10px;
      font-family: monospace;
      font-size:12px;
      color:black;
      background:white;
    }


    .receipt {
      width:100%;
    }


    .center {
      text-align:center;
    }


    .row {
      display:flex;
      justify-content:space-between;
    }


    .divider {
      border-top:1px dashed black;
      margin:8px 0;
    }


    button {
      display:none;
    }


    </style>

    </head>


    <body>

    ${content.innerHTML}

    </body>


    </html>
  `);


  printWindow.document.close();


  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

};