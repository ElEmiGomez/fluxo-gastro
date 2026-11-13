import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getOpeningStatus } from '../../src/lib/opening-hours-calculator.ts'
import type { OpeningSchedule } from '../../src/types/gastronomic-web.types.ts'

test('getOpeningStatus correctly marks open during standard lunch shift', () => {
  const schedules: OpeningSchedule[] = [
    { dayOfWeek: 2, open: '13:00', close: '16:00', label: 'Almuerzo' }, // Martes
  ]

  // Martes a las 14:15
  const tuesdayLunch = new Date('2026-11-17T14:15:00')
  const result = getOpeningStatus(schedules, tuesdayLunch)

  assert.equal(result.isOpen, true)
  assert.equal(result.label, 'Abierto ahora')
  assert.equal(result.subLabel, 'Cierra a las 16:00')
})

test('getOpeningStatus correctly marks closed outside shift', () => {
  const schedules: OpeningSchedule[] = [
    { dayOfWeek: 2, open: '13:00', close: '16:00' }, // Martes
  ]

  // Martes a las 18:00
  const tuesdayAfternoon = new Date('2026-11-17T18:00:00')
  const result = getOpeningStatus(schedules, tuesdayAfternoon)

  assert.equal(result.isOpen, false)
  assert.equal(result.label, 'Cerrado ahora')
})

test('getOpeningStatus handles midnight boundary on same evening', () => {
  const schedules: OpeningSchedule[] = [
    { dayOfWeek: 5, open: '20:00', close: '03:00' }, // Viernes noche
  ]

  // Viernes 23:30
  const fridayNight = new Date('2026-11-20T23:30:00')
  const result = getOpeningStatus(schedules, fridayNight)

  assert.equal(result.isOpen, true)
  assert.equal(result.label, 'Abierto ahora')
  assert.equal(result.subLabel, 'Cierra a las 03:00')
})

test('getOpeningStatus handles midnight boundary on early morning next day', () => {
  const schedules: OpeningSchedule[] = [
    { dayOfWeek: 5, open: '20:00', close: '03:00' }, // Viernes noche hasta madrugada sábado
  ]

  // Sábado 01:45 AM
  const saturdayEarly = new Date('2026-11-21T01:45:00')
  const result = getOpeningStatus(schedules, saturdayEarly)

  assert.equal(result.isOpen, true)
  assert.equal(result.label, 'Abierto ahora')
  assert.equal(result.subLabel, 'Cierra a las 03:00')
})

test('getOpeningStatus marks closed once midnight shift has ended', () => {
  const schedules: OpeningSchedule[] = [
    { dayOfWeek: 5, open: '20:00', close: '03:00' }, // Viernes noche hasta 03:00
  ]

  // Sábado 03:15 AM
  const saturdayLate = new Date('2026-11-21T03:15:00')
  const result = getOpeningStatus(schedules, saturdayLate)

  assert.equal(result.isOpen, false)
  assert.equal(result.label, 'Cerrado ahora')
})
