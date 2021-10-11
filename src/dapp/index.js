import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            // console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });


        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flightNumber = DOM.elid('flight-number').value;
            contract.fetchFlightStatus(flightNumber, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: flightNumber } ]);
            });
        });

        DOM.elid('purchase').addEventListener('click', () => {
            let flightNumber = DOM.elid('flights').value;
            let passenger = DOM.elid('passenger-address-buy').value;
            let amount = DOM.elid('insurance').value;

            contract.buyInsurance(passenger, amount, flightNumber, (error, result) => {
                display('Purchase', 'Purchase insurance', [ { label: 'Purchase insurance:', error: error, value: flightNumber + ' ' + amount + ' ' + 'ether'} ]);
            });
        });

        DOM.elid('get-balance').addEventListener('click', () => {
            let passenger = DOM.elid('passenger-address-balance').value;
            contract.getAccountBalance(passenger, (error, balance) => {
                display('Payout account', 'Balance available to pay out', [ { label: 'Balance for ', error: error, value: passenger + ' is: ' + balance} ]);
            });
        });

        DOM.elid('withdraw').addEventListener('click', () => {
            let passenger = DOM.elid('passenger-address-withdraw').value;
            contract.payInsurance(passenger, (error, text) => {
                display('Payout', 'Pay insurance to passenger', [ { label: 'Pay insurance:', error: error, value: text} ]);
            });
        });
    });


})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}
