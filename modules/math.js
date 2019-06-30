/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 thecsw
/* Last modified by Keanu73 <keanu@keanu73.net> on 2019-06-30
/* All rights reserved.
*/

const math = {}

math.calculate = (newNumber, oldNumber, net_worth) => {
	// Treat anything below 0 upvotes as 0 upvotes
	if (oldNumber < 0) {
		oldNumber = 0
	}

	if (newNumber < 0) {
		newNumber = 0
	}

	// Compute gain
	let delta = newNumber - oldNumber

	// Treat negative gain as no gain
	if (delta < 0) {
		delta = 0
	}

	// Compute the maximum of the sigmoid
	const sig_max = math.sigmoid_max(oldNumber)

	// Compute the midpoint of the sigmoid
	const sig_mp = math.sigmoid_midpoint(oldNumber)

	// Compute the steepness of the sigmoid
	const sig_stp = math.sigmoid_steepness(oldNumber)

	// Calculate return
	let factor = math.sigmoid(delta, sig_max, sig_mp, sig_stp)

	factor -= 1
	factor = factor * math.net_worth_coefficient(net_worth)
	return factor + 1
}

math.sigmoid = function (x, maxvalue, midpoint, steepness) {
	const arg = -(steepness * (x - midpoint))
	const y = maxvalue / (1 + Math.exp(arg))
	return y
}

math.sigmoid_max = (oldNumber) => {
	return 1.2 + 0.6 / ((oldNumber / 10) + 1)
}

math.sigmoid_midpoint = function (oldNumber) {
	const sig_mp_0 = 10
	const sig_mp_1 = 500
	return math.linear_interpolate(oldNumber, 0, 25000, sig_mp_0, sig_mp_1)
}

math.sigmoid_steepness = function (oldNumber) {
	return 0.06 / ((oldNumber / 100) + 1)
}

math.linear_interpolate = function (x, x_0, x_1, y_0, y_1) {
	const m = (y_1 - y_0) / x_1 - x_0
	const c = y_0
	const y = (m * x) + c
	return y
}

math.net_worth_coefficient = function (net_worth) {
	return Math.pow(net_worth, -0.155) * 6
}

math.calculate_factor = (oldUpvotes, newUpvotes, netWorth) => {
	const factor = (math.calculate(newUpvotes, oldUpvotes, netWorth) - 1) * 100

	const max_factor = (math.calculate(50e5, oldUpvotes, netWorth) - 1) * 100

	return [factor, max_factor]
}

math.calculateBreakEvenPoint = (upvotes) => {
	return Math.round(math.calculatePoint(1, upvotes, 100) * 100) / 100
}

math.calculatePoint = (factor, oldNumber, net_worth) => {
	const y = oldNumber
	let z = factor
	let TOL

	let x = y
	let newFactor = math.calculate(x, y, net_worth)

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
				newFactor = math.calculate(x, y, net_worth)
			}
		} else {
			while (newFactor < z) {
				x = x + TOL
				newFactor = math.calculate(x, y, net_worth)
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
			newFactor = math.calculate(x, y, net_worth)
		}
	}

	return x
}

math.calculateFirmPayout = (balance, size, execs, assocs, cfo, coo) => {
	balance -= 0.1 * balance

	// 50 % of remaining firm coins are paid out
	const payout_amount = 0.5 * balance

	// 30 % paid to board members(CEO, COO, CFO)(30 % of total payroll)
	const board_total = payout_amount * 0.3
	let board_members = 1
	if (cfo) board_members += 1
	if (coo) board_members += 1
	const board_amount = board_total / board_members

	let remaining_amount = payout_amount - board_total

	// 40 % of remaining paid to executives(28 % of total payroll)
	let exec_amount = 0
	let exec_total = 0
	if (execs > 0) exec_total = remaining_amount * 0.4
	exec_amount = exec_total / execs

	remaining_amount -= exec_total

	// 50 % of remaining paid to associates(21 % of total payroll)
	let assoc_amount = 0
	let assoc_total = 0
	if (assocs > 0) assoc_total = remaining_amount * 0.5
	assoc_amount = assoc_total / assocs
	remaining_amount -= assoc_total

	// 100 % of remaining paid to floor traders(21 % of total payroll)
	const trader_total = remaining_amount
	const tradernbr = size - execs - assocs - board_members
	const trader_amount = trader_total / Math.max(tradernbr, 1)

	const info = {
		total: payout_amount,
		board: {
			amount: board_amount,
			total: board_total
		},
		exec: {
			amount: exec_amount,
			total: exec_total
		},
		assoc: {
			amount: assoc_amount,
			total: assoc_total
		},
		trader: {
			amount: trader_amount,
			total: trader_total
		}
	}

	return info
}

module.exports = math