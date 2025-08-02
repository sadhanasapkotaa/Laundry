import React from 'react'

const page = () => {

    var payableAmount = 3000;

    const handleEsewaPayment = () => {
        // Code to handle esewa payment here 
    };
  return (
    <div>

    <h1>This is the page where you decide to pay</h1>
    <button onClick={handleEsewaPayment}>Pay Via e-sewa</button>
    <p>Onclick of this button, you pay $`{payableAmount}`</p>

    </div>
  )
}

export default page