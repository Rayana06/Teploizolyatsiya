import { Container, Navbar } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export function BrandHeader() {
  return (
    <Navbar className="brand-header">
      <Container className="content-shell">
        <Navbar.Brand as={Link} to="/" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">Т</span>
          <strong>ТЕПЛОЩИТ</strong>
        </Navbar.Brand>
      </Container>
    </Navbar>
  )
}
