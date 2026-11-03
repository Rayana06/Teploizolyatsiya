import { Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', icon: 'bi-house-door', label: 'Лента', enabled: true },
  { to: '/add', icon: 'bi-plus-circle', label: 'Добавление', enabled: false },
  { to: '/catalog', icon: 'bi-grid', label: 'Плитка', enabled: true },
  { to: '/login', icon: 'bi-box-arrow-in-right', label: 'Вход', enabled: false },
]

export function BottomNav() {
  return (
    <Nav className="bottom-nav" aria-label="Основная навигация">
      <div className="bottom-nav__inner">
        {items.map((item) => item.enabled ? (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ) : (
          <span key={item.label} className="bottom-nav__item disabled" aria-disabled="true" title="Недоступно гостю">
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </Nav>
  )
}
