module.exports = async () => {
	function calculate(newNumber, oldNumber, net_worth) {
		// Treat anything below 0 upvotes as 0 upvotes
		if (oldNumber < 0) {
			oldNumber = 0
		}

		if (newNumber < 0) {
			newNumber = 0
		}

		// Compute gain
		var delta = newNumber - oldNumber

		// Treat negative gain as no gain
		if (delta < 0) {
			delta = 0
		}

		// Compute the maximum of the sigmoid
		var sig_max = sigmoid_max(oldNumber)

		// Compute the midpoint of the sigmoid
		var sig_mp = sigmoid_midpoint(oldNumber)

		// Compute the steepness of the sigmoid
		var sig_stp = sigmoid_steepness(oldNumber)

		// Calculate return
		var factor = sigmoid(delta, sig_max, sig_mp, sig_stp)

		factor = factor - 1
		factor = factor * net_worth_coefficient(net_worth)
		return factor + 1
	}

	function sigmoid(x, maxvalue, midpoint, steepness) {
		var arg = -(steepness * (x - midpoint))
		var y = maxvalue / (1 + Math.exp(arg))
		return y
	}

	function sigmoid_max(oldNumber) {
		return 1.2 + 0.6 / ((oldNumber / 10) + 1)
	}

	function sigmoid_midpoint(oldNumber) {
		var sig_mp_0 = 10
		var sig_mp_1 = 500
		return linear_interpolate(oldNumber, 0, 25000, sig_mp_0, sig_mp_1)
	}

	function sigmoid_steepness(oldNumber) {
		return 0.06 / ((oldNumber / 100) + 1)
	}

	function linear_interpolate(x, x_0, x_1, y_0, y_1) {
		var m = (y_1 - y_0) / x_1 - x_0
		var c = y_0
		var y = (m * x) + c
		return y
	}

	function net_worth_coefficient(net_worth) {
		return Math.pow(net_worth, -0.155) * 6
	}

	function calculateInvestmentReturn(oldUpvotes, newUpvotes, netWorth) {
		const factor = calculate(newUpvotes, oldUpvotes, netWorth)

		const investmentReturn = (Math.round((factor - 1) * 100 * 100)) / 100
		//var upperLimit = (Math.round(sigmoid_max(oldUpvotes) * 10000) - 10000) / 100 + "%";
		//var upperLimitAmount = calculatePoint(sigmoid_max(oldUpvotes), oldUpvotes, netWorth);

		return investmentReturn
	}

	function calculateBreakEvenPoint(upvotes) {
		return Math.round(calculatePoint(1, upvotes, 100) * 100) / 100
	}

	function calculatePoint(factor, oldNumber, net_worth) {
		var y = oldNumber
		var z = factor
		let TOL

		var x = y
		var newFactor = calculate(x, y, net_worth)

		if (factor !== 1) {
			z = 0.999 * factor

			if (y > 50000) {
				TOL = 50
			} else if (y > 2000) {
				TOL = 10
			} else {
				TOL = 1
			}

			if (newFactor > z) {
				while (newFactor > z) {
					x = x - TOL
					newFactor = calculate(x, y, net_worth)
				}
			} else {
				while (newFactor < z) {
					x = x + TOL
					newFactor = calculate(x, y, net_worth)
				}
			}
		} else {
			if (y > 50000) {
				TOL = 1
			} else if (y > 2000) {
				TOL = 0.1
			} else {
				TOL = 0.01
			}

			while (newFactor < z) {
				x = x + TOL
				newFactor = calculate(x, y, net_worth)
			}
		}

		return x
	}
	// Have to hold off on firm payouts for now until my PR is accepted
	/*function calculateFirmPayout(balance, size, cfo, coo, execs, assocs, floorts) {
		balance -= 0.1 * balance

		// 50 % of remaining firm coins are paid out
		payout_amount = 0.5 * firm.balance

		// 30 % paid to board members(CEO, COO, CFO)(30 % of total payroll)
		board_total = payout_amount * 0.3
		board_members = 1 + firm.coo + firm.cfo
		board_amount = int(board_total / board_members)

		remaining_amount = payout_amount - board_total

		// 40 % of remaining paid to executives(28 % of total payroll)
		exec_amount = 0
		exec_total = 0
		if (execs > 0) exec_total = remaining_amount * 0.4
		exec_amount = int(exec_total / firm.execs)
		remaining_amount -= exec_total

		// 50 % of remaining paid to associates(21 % of total payroll)
		assoc_amount = 0
		assoc_total = 0
		if (assocs > 0) assoc_total = remaining_amount * 0.5
		assoc_amount = assoc_total / assocs)
		remaining_amount -= assoc_total

		// 100 % of remaining paid to associates(21 % of total payroll)
		trader_total = remaining_amount
		tradernbr = firm.size - firm.execs - firm.assocs - firm.ceo - firm.cfo - firm.coo
		trader_amount = int(trader_total / max(tradernbr, 1))
	}*/
}