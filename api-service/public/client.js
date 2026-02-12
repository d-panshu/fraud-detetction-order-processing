const socket = io();

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("orderUpdate", (data) => {
  console.log("Order Update:", data);

  const resultDiv = document.getElementById("result");

  resultDiv.innerHTML = `
    <div class="alert ${
      data.status === "APPROVED"
        ? "alert-success"
        : "alert-danger"
    }">
      Transaction ${data.transactionId} → 
      <strong>${data.status}</strong> 
      (Fraud Score: ${data.fraudProbability.toFixed(2)})
    </div>
  `;
});
