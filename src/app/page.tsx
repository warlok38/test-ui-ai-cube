export default function Home() {
  const fillerParagraphs = Array.from({ length: 28 }, (_, index) => (
    <p key={index}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere, neque nec feugiat
      placerat, risus neque volutpat lectus, at interdum lectus libero in augue. Curabitur non
      massa et mauris faucibus aliquet. Donec quis velit ut risus cursus posuere. Duis suscipit
      sem id nibh condimentum, sed dignissim erat fermentum.
    </p>
  ))

  return (
    <div>
      <h1>Main content</h1>
      {fillerParagraphs}
    </div>
  )
}
