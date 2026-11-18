import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { LocaleProvider } from './i18n/LocaleProvider'

function renderApp() {
  window.localStorage.clear()
  const user = userEvent.setup()
  render(
    <LocaleProvider>
      <App />
    </LocaleProvider>,
  )
  return user
}

function answer() {
  return screen.getByRole('region', { name: 'Answer' })
}

describe('Bin It Right', () => {
  it('answers a quick pick with the destination, the quote, its source link and the save date', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Pizza box' }))
    const region = answer()
    expect(within(region).getByText('Green organics cart')).toBeInTheDocument()
    expect(within(region).getByRole('heading', { name: 'Food-soiled paper (napkins, paper towels, pizza boxes)' })).toBeInTheDocument()
    const sourceLinks = within(region).getAllByRole('link', { name: /Residential Organics \(Green Cart\) Collection, saved Nov 17, 2026/ })
    expect(sourceLinks[0]).toHaveAttribute(
      'href',
      'https://www.longbeach.gov/lbrecycles/yard-trimmings-food-scraps/residential-yard-trimmings-and-food-scraps-collection/',
    )
    expect(within(region).getByText(/If a private hauler collects your carts, ask them/)).toBeInTheDocument()
  })

  it('answers typed text after normalising plurals and filler words', async () => {
    const user = renderApp()
    await user.type(screen.getByRole('textbox', { name: 'What are you throwing away?' }), 'the Glass Jars{Enter}')
    expect(within(answer()).getByText('Blue recycling cart')).toBeInTheDocument()
  })

  it('asks "did you mean" for an ambiguous word and answers once one is picked', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Battery' }))
    const region = answer()
    expect(within(region).getByText('Did you mean one of these?')).toBeInTheDocument()
    await user.click(within(region).getByRole('button', { name: /Lithium primary/ }))
    expect(within(answer()).getByText('Household hazardous waste drop-off')).toBeInTheDocument()
  })

  it('says no official rule was found and gives the City contact route', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Aluminum foil' }))
    const region = answer()
    expect(within(region).getByText('No official rule found')).toBeInTheDocument()
    expect(within(region).getByRole('link', { name: /lbrecycles@longbeach.gov/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:lbrecycles@longbeach\.gov\?subject=/),
    )
    expect(within(region).getByRole('link', { name: /\(562\) 570-2876/ })).toHaveAttribute('href', 'tel:+15625702876')
  })

  it("shows the City's own Spanish wording in Spanish mode", async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    expect(document.documentElement.lang).toBe('es')
    await user.click(screen.getByRole('button', { name: 'Bolsa de plástico' }))
    const region = screen.getByRole('region', { name: 'Respuesta' })
    expect(within(region).getByText('Basura')).toBeInTheDocument()
    expect(within(region).getAllByText('Bolsas de plástico, film transparente, bolsas para botanas y envolturas de dulces.').length).toBeGreaterThan(0)
  })

  it('says when the City publishes a rule in English only instead of translating it', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    await user.click(screen.getByRole('button', { name: 'Pintura' }))
    const region = screen.getByRole('region', { name: 'Respuesta' })
    expect(within(region).getAllByText('La Ciudad publica esta regla solo en inglés, por eso se muestra en inglés.').length).toBeGreaterThan(0)
    expect(within(region).getByRole('heading', { name: 'Paint and paint thinners' })).toBeInTheDocument()
  })
})
