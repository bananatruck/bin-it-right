import { normalize } from './normalize'

describe('normalize', () => {
  it.each([
    ['boxes', 'box'], ['batteries', 'battery'], ['bottles', 'bottle'], ['dishes', 'dish'],
    ['glasses', 'glass'], ['ashes', 'ash'], ['mattresses', 'mattress'], ['phones', 'phone'],
    ['stones', 'stone'], ['cones', 'cone'], ['tires', 'tire'], ['bulbs', 'bulb'], ['jars', 'jar'], ['cans', 'can'], ['leaves', 'leaf'],
    ['latas', 'lata'], ['botellas', 'botella'], ['pilas', 'pila'], ['envases', 'envase'],
    ['cartones', 'carton'], ['recortes', 'recorte'], ['glass', 'glass'], ['grass', 'grass'],
    ['gas', 'gas'], ['mattress', 'mattress'], ['plastic', 'plastic'], ['cardboard', 'cardboard'],
    ['knives', 'knife'], ['lens', 'lens'], ['series', 'series'], ['bus', 'bus'],
    ['its', 'its'], ['this', 'this'], ['styrofoam', 'styrofoam'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalize(input).normalized).toBe(expected)
  })

  it('removes accents, folds compatibility characters and separates punctuation', () => {
    const original = '  ¡PLÁSTICO!\tWidgets-１２３ café\u0301  '
    expect(normalize(original)).toEqual({
      original, normalized: 'plastico widget 123 cafe', tokens: ['plastico', 'widget', '123', 'cafe'], dropped: [],
    })
  })

  it('drops only listed filler words and preserves their order and repetitions', () => {
    const original = 'a an the my some old empty please un una unos unas el la los las de del mi mis the used widgets'
    expect(normalize(original)).toEqual({
      original, normalized: 'used widget', tokens: ['used', 'widget'],
      dropped: original.split(' ').slice(0, -2),
    })
    expect(normalize('used motor oil').normalized).toBe('used motor oil')
  })

  it.each(['', '  ', '!?', 'the old empty', 'el la de mi'])('returns empty for %j', (query) => {
    expect(normalize(query).normalized).toBe('')
    expect(normalize(query).tokens).toEqual([])
  })

  it.each(['boxes', 'glasses', 'cartones', 'plástico', 'old bottles', 'leaves', 'envases'])('is idempotent for %s', (query) => {
    const first = normalize(query)
    expect(normalize(first.normalized).normalized).toBe(first.normalized)
  })
})
