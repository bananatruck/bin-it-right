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
    const sourceLinks = within(region).getAllByRole('link', { name: /Residential Organics \(Green Cart\) Collection, saved [A-Z][a-z]{2} \d{1,2}, \d{4}/ })
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
    expect(within(region).getByText('No official rule found in this app')).toBeInTheDocument()
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

describe('screen-reader and edge behaviour', () => {
  it('announces a one-line status instead of reading the whole answer twice', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Paint' }))
    expect(screen.getByRole('status')).toHaveTextContent('Paint and paint thinners: Household hazardous waste drop-off')
    expect(answer()).not.toHaveAttribute('aria-live')
    expect(screen.getByRole('heading', { level: 2, name: /Where it goes Household hazardous waste drop-off/ })).toBeInTheDocument()
  })

  it('shows the "type an item" card for a blank query instead of keeping the old answer', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Paint' }))
    await user.type(screen.getByRole('textbox', { name: 'What are you throwing away?' }), '   {Enter}')
    expect(within(answer()).getByText('Type an item to search')).toBeInTheDocument()
  })

  it('writes the gap report in Spanish in Spanish mode', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    await user.type(screen.getByRole('textbox', { name: '¿Qué vas a tirar?' }), 'xilófono{Enter}')
    const mail = within(screen.getByRole('region', { name: 'Respuesta' })).getByRole('link', { name: /lbrecycles@longbeach.gov/ })
    expect(decodeURIComponent(mail.getAttribute('href') ?? '')).toContain('Consulta sobre cómo desechar: xilófono')
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument()
  })
})

describe('the private-hauler note (round 2 review)', () => {
  it('appears on cart answers, which depend on City collection service', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Plastic bag' }))
    expect(within(answer()).getByText(/If a private hauler collects your carts, ask them/)).toBeInTheDocument()
  })

  it('does not appear on public drop-offs, which the City opens to all residents', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Paint' }))
    expect(within(answer()).queryByText(/If a private hauler collects your carts, ask them/)).not.toBeInTheDocument()
  })
})

describe('screen-reader details (round 2 review)', () => {
  it('marks English fallback labels as English in Spanish mode', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    await user.click(screen.getByRole('button', { name: 'Pintura' }))
    const region = screen.getByRole('region', { name: 'Respuesta' })
    expect(within(region).getByText('Household hazardous waste drop-off')).toHaveAttribute('lang', 'en')
    expect(within(region).getByText('Paint and paint thinners')).toHaveAttribute('lang', 'en')
  })

  it('makes the no-rule title a heading, like the other result titles', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Aluminum foil' }))
    expect(within(answer()).getByRole('heading', { level: 2, name: /No official rule found/ })).toBeInTheDocument()
  })
})

describe('round 3 review', () => {
  it('marks typeahead terms with their own language', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    const box = screen.getByRole('textbox', { name: '¿Qué vas a tirar?' })
    await user.type(box, 'paint')
    const list = screen.getByRole('list', { name: 'Artículos que coinciden' })
    expect(within(list).getByRole('button', { name: 'Paint and paint thinners' })).toHaveAttribute('lang', 'en')
    await user.clear(box)
    await user.type(box, 'pintu')
    expect(within(screen.getByRole('list', { name: 'Artículos que coinciden' })).getByRole('button', { name: 'pintura' })).toHaveAttribute('lang', 'es')
  })

  it('stops showing "Copied" once the report text changes with the language', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Aluminum foil' }))
    await user.click(within(answer()).getByRole('button', { name: 'Copy a gap report' }))
    expect(within(answer()).getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    expect(within(screen.getByRole('region', { name: 'Respuesta' })).getByRole('button', { name: 'Copiar consulta para la Ciudad' })).toBeInTheDocument()
  })

  it.each(['denied', 'unavailable'])('offers a selectable report when the clipboard is %s', async (failure) => {
    const user = renderApp()
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    if (failure === 'denied') vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    else Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    try {
      await user.click(screen.getByRole('button', { name: 'Aluminum foil' }))
      await user.click(within(answer()).getByRole('button', { name: 'Copy a gap report' }))
      expect(within(answer()).getByRole('alert')).toHaveTextContent('Could not copy. Select and copy the report below.')
      const fallback = within(answer()).getByRole('textbox', { name: 'Gap report' })
      expect(fallback).toHaveAttribute('readonly')
      const mailto = within(answer()).getByRole('link', { name: /lbrecycles@longbeach.gov/ }).getAttribute('href')
      if (mailto === null) throw new Error('Missing report email link')
      expect(fallback).toHaveValue(new URL(mailto).searchParams.get('body'))
      expect(within(answer()).queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Español' }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      if (descriptor !== undefined) Object.defineProperty(navigator, 'clipboard', descriptor)
      vi.restoreAllMocks()
    }
  })

  it('pins each saved-copy link to the commit the dataset was built from', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: /^Sources/ }))
    const links = screen.getAllByRole('link', { name: /Saved copy/ })
    expect(links[0]?.getAttribute('href')).toMatch(/\/blob\/[0-9a-f]{40}\/data\/snapshots\/[a-z0-9-]+\.txt$/)
  })
})
