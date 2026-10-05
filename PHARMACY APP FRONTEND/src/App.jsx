import { useEffect, useState } from 'react'

const products = [
  { id: 'p1', name: 'Vitamin C 1000mg', brand: 'Nature Made', size: '60 tablets', price: 12500, category: 'Vitamins', color: 'peach', tag: 'BESTSELLER', image: '/vitamin-c.jpg' },
  { id: 'p2', name: 'Daily Multivitamin', brand: 'Wellness Lab', size: '30 capsules', price: 18000, category: 'Vitamins', color: 'mint', tag: 'DAILY CARE', image: '/multivitamin.jpg' },
  { id: 'p3', name: 'Allergy Relief', brand: 'ClearDay', size: '24 tablets', price: 9750, category: 'Allergy', color: 'lilac', tag: 'NON-DROWSY', image: '/allergy-relief.jpg' },
  { id: 'p4', name: 'Hydrating Skin Cream', brand: 'DermaCare', size: '50ml', price: 16250, category: 'Personal care', color: 'blue', tag: 'GENTLE', image: '/hydrating-skin.jpg' },
  { id: 'p5', name: 'Omega-3 Fish Oil', brand: 'Nature Made', size: '90 softgels', price: 21500, category: 'Vitamins', color: 'yellow', tag: 'POPULAR', image: '/omega-3.jpg' },
  { id: 'p6', name: 'First Aid Bandages', brand: 'CarePlus', size: '40 strips', price: 6500, category: 'First aid', color: 'rose', tag: 'ESSENTIAL', image: '/first-aid-bandages.jpg' },
  { id: 'p7', name: 'Ibuprofen 200mg', brand: 'MediRelief', size: '24 tablets', price: 7250, category: 'Pain relief', color: 'blue', tag: 'PAIN RELIEF', image: '/pain-relief.jpg' },
  { id: 'p8', name: 'Zinc 25mg', brand: 'Wellness Lab', size: '60 tablets', price: 11000, category: 'Vitamins', color: 'mint', tag: 'IMMUNITY', image: '/zinc.jpg' },
  { id: 'p9', name: 'Soothing Hand Cream', brand: 'DermaCare', size: '75ml', price: 8500, category: 'Personal care', color: 'peach', tag: 'MOISTURIZE', image: '/soothing-hand-cream.jpg' },
]

const categories = [
  { name: 'All products', icon: '✳' },
  { name: 'Vitamins', icon: '🌿' },
  { name: 'Pain relief', icon: '☼' },
  { name: 'Allergy', icon: '✿' },
  { name: 'Personal care', icon: '◌' },
  { name: 'First aid', icon: '✚' },
]
const statuses = ['Pending', 'Processing', 'Ready for pickup', 'Out for delivery', 'Completed', 'Cancelled']
const freeDeliveryThreshold = 35000
const deliveryFee = 4500
const thumbColors = { peach: '#fbefe5', mint: '#eaf3e9', lilac: '#f0edf7', blue: '#e8f0f5', yellow: '#f7f2df', rose: '#f7eaea' }

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.error(`Unable to load ${key} from local storage.`, error)
    return fallback
  }
}

function loadOrders() {
  const orders = loadStorage('carewell-orders', [])
  if (!Array.isArray(orders)) return []

  try {
    if (localStorage.getItem('carewell-currency-version') !== 'NGN-v1') {
      const convertedOrders = orders.map(order => ({
        ...order,
        total: Number.isFinite(Number(order.total)) ? Math.round(Number(order.total) * 1000) : order.total,
      }))
      localStorage.setItem('carewell-orders', JSON.stringify(convertedOrders))
      localStorage.setItem('carewell-currency-version', 'NGN-v1')
      return convertedOrders
    }
  } catch (error) {
    console.error('Unable to update saved orders to Nigerian naira.', error)
  }
  return orders
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

function quantityLabel(count) {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

function getProductById(id) {
  return products.find(product => product.id === id) || null
}

function Icon({ name, size = 18 }) {
  const shapes = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    orders: <><path d="M8 5h12M8 12h12M8 19h12" /><path d="m3 5 1 1 2-2m-3 8 1 1 2-2m-3 8 1 1 2-2" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    pharmacy: <path d="M12 3v18M3 12h18" />,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
    truck: <><path d="M3 6h12v12H3z" /><path d="M15 10h4l3 3v5h-7" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="18.5" cy="18" r="1.5" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>
}

function ProductCard({ product, isSaved, onToggleSaved, onAdd }) {
  return (
    <article className="product-card">
      <div className={`product-visual ${product.color}`}>
        <span className="product-tag">{product.tag}</span>
        <button className={`favorite ${isSaved ? 'liked' : ''}`} onClick={() => onToggleSaved(product.id)} aria-label={`${isSaved ? 'Remove from' : 'Add to'} saved items`}>
          <Icon name="heart" size={14} />
        </button>
        <img className="vitamin-c-image" src={product.image} alt={`${product.name} product image`} />
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-size">{product.size}</div>
        <div className="product-bottom">
          <div className="product-price">{formatMoney(product.price)} <small>/ pack</small></div>
          <button className="add-button" onClick={() => onAdd(product.id)} aria-label={`Add ${product.name} to cart`}><Icon name="plus" size={13} /> Add</button>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [cart, setCart] = useState(() => {
    const stored = loadStorage('carewell-cart', [])
    return Array.isArray(stored)
      ? stored.filter(item => item && typeof item.id === 'string' && getProductById(item.id) && Number.isInteger(item.quantity) && item.quantity > 0)
      : []
  })
  const [orders, setOrders] = useState(loadOrders)
  const [savedItems, setSavedItems] = useState(() => {
    const stored = loadStorage('carewell-saved', [])
    return Array.isArray(stored) ? stored : []
  })
  const [customerRequests, setCustomerRequests] = useState(() => {
    const stored = loadStorage('carewell-requests', [])
    return Array.isArray(stored) ? stored : []
  })
  const [category, setCategory] = useState('All products')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('popular')
  const [page, setPage] = useState('shop')
  const [statusFilter, setStatusFilter] = useState('All orders')
  const [orderSearch, setOrderSearch] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [delivery, setDelivery] = useState('Home delivery')
  const [toast, setToast] = useState('')

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => {
    const product = getProductById(item.id)
    return total + (product ? product.price * item.quantity : 0)
  }, 0)
  const deliveryCost = cart.length && subtotal < freeDeliveryThreshold ? deliveryFee : 0
  const pendingNotifications = orders.filter(order => order.status === 'Processing').length
  const pendingCustomerRequests = customerRequests.filter(request => request.status === 'New').length

  useEffect(() => {
    try {
      localStorage.setItem('carewell-cart', JSON.stringify(cart))
      localStorage.setItem('carewell-orders', JSON.stringify(orders))
      localStorage.setItem('carewell-saved', JSON.stringify(savedItems))
      localStorage.setItem('carewell-requests', JSON.stringify(customerRequests))
    } catch (error) {
      console.error('Unable to save your pharmacy data.', error)
    }
  }, [cart, orders, savedItems, customerRequests])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleProducts = products
    .filter(product => {
      const matchesCategory = category === 'All products' || product.category === category
      const matchesSearch = `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price
      if (sort === 'price-high') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  function addToCart(id) {
    const product = getProductById(id)
    if (!product) return

    setCart(current => {
      const existing = current.find(item => item.id === id)
      return existing
        ? current.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { id, quantity: 1 }]
    })
    setToast(`${product.name} added to your basket.`)
  }

  function changeQuantity(id, change) {
    if (!getProductById(id)) return

    setCart(current => current
      .map(item => item.id === id ? { ...item, quantity: item.quantity + change } : item)
      .filter(item => item.quantity > 0))
  }

  function toggleSaved(id) {
    const isSaved = savedItems.includes(id)
    setSavedItems(current => isSaved ? current.filter(item => item !== id) : [...current, id])
    setToast(isSaved ? 'Removed from your saved items.' : 'Added to your saved items.')
  }

  function updateOrderStatus(id, status) {
    setOrders(current => current.map(order => order.id === id ? { ...order, status } : order))
    setToast(`Order ${id} updated to ${status}.`)
  }

  function updateCustomerRequestStatus(id, status) {
    setCustomerRequests(current => current.map(request => request.id === id ? { ...request, status } : request))
    setToast(`Request ${id} updated to ${status}.`)
  }

  function submitCustomerRequest(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const type = String(form.get('type')).trim()
    const message = String(form.get('message')).trim()

    if (!name || !type || !message) {
      setToast('Please complete the pharmacist request form.')
      return
    }

    const request = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      customer: name,
      type,
      message,
      date: new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()),
      status: 'New',
    }

    setCustomerRequests(current => [request, ...current])
    setPage('my-orders')
    setToast(`Your request ${request.id} was sent to the pharmacist.`)
    event.currentTarget.reset()
  }

  function placeOrder(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const customer = String(form.get('name')).trim()
    const email = String(form.get('email')).trim()
    const address = String(form.get('address')).trim()
    if (!customer || !email || !address) {
      setToast('Please complete all delivery details.')
      return
    }

    if (!cart.length) {
      setToast('Your basket is empty. Add a medicine before placing an order.')
      return
    }

    const selectedDelivery = String(form.get('delivery'))
    const fee = subtotal >= freeDeliveryThreshold || selectedDelivery === 'Pick up at pharmacy' ? 0 : deliveryFee
    const normalizedItems = cart
      .map(item => {
        const product = getProductById(item.id)
        return product ? { name: product.name, quantity: item.quantity } : null
      })
      .filter(Boolean)

    if (!normalizedItems.length) {
      setToast('Your basket contains items that can no longer be ordered. Please remove them and try again.')
      return
    }

    const order = {
      id: `NC-${Date.now().toString().slice(-6)}`,
      customer,
      email,
      address,
      delivery: selectedDelivery,
      date: new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()),
      items: normalizedItems,
      total: subtotal + fee,
      status: 'Pending',
    }
    setOrders(current => [...current, order])
    setCart([])
    setCheckoutOpen(false)
    setPage('my-orders')
    setToast(`Order ${order.id} placed. Your pharmacist has been notified.`)
  }

  function renderSidebar() {
    return (
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src="/pharmacy-logo.png" alt="Pharmacy logo" /></div>
          <div className="brand-copy">
            <div className="brand-name">NaijaCare <span>Pharmacy</span></div>
            <div className="brand-address">14B Concorde Road, Owerri,<br />Imo State</div>
          </div>
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="nav-list" aria-label="Main navigation">
          <NavButton active={page === 'shop'} onClick={() => setPage('shop')} iconName="grid">Browse medicines</NavButton>
          <NavButton active={page === 'my-orders'} onClick={() => setPage('my-orders')} iconName="bag" count={orders.length}>My orders</NavButton>
          <NavButton active={page === 'requests'} onClick={() => setPage('requests')} iconName="bell" count={pendingCustomerRequests}>Customer requests</NavButton>
          <NavButton active={page === 'pharmacist'} onClick={() => setPage('pharmacist')} iconName="orders" count={orders.filter(order => !['Completed', 'Cancelled'].includes(order.status)).length}>Pharmacist orders</NavButton>
          <NavButton active={page === 'saved'} onClick={() => setPage('saved')} iconName="heart">Saved items</NavButton>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Icon name="heart" size={16} /></div>
            <strong>Need a little help?</strong>
            <p>Our pharmacy team is here to help you find what you need.</p>
            <a href="mailto:hello@naijacarepharmacy.example" className="support-link">Talk to a pharmacist →</a>
          </div>
          <div className="profile">
            <div className="avatar">FI</div>
            <div><div className="profile-name">Fabian Ibeh</div><div className="profile-role">Personal account</div></div>
            <span className="profile-dots">···</span>
          </div>
        </div>
      </aside>
    )
  }

  function renderCart() {
    return (
      <aside className="right-column">
        <section className="panel cart-panel">
          <div className="panel-heading"><h2>Your basket</h2><span className="panel-subtitle">{quantityLabel(itemCount)}</span></div>
          <div className="cart-items">
            {cart.length ? cart.map(item => {
              const product = getProductById(item.id)
              if (!product) return null
              return (
                <div className="cart-item" key={item.id}>
                  <div className="cart-thumb" style={{ background: thumbColors[product.color] }}>{product.category === 'Vitamins' ? '🌿' : product.category === 'Pain relief' ? '💊' : product.category === 'Personal care' ? '🧴' : '✚'}</div>
                  <div className="cart-item-copy"><strong>{product.name}</strong><small>{formatMoney(product.price)} / pack</small></div>
                  <div className="quantity-control">
                    <button onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${product.name}`}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${product.name}`}>+</button>
                  </div>
                </div>
              )
            }) : <div className="cart-empty"><span>＋</span>Your basket is taking a breather.<br />Add a medicine to get started.</div>}
          </div>
          <div className="cart-totals">
            <div className="total-row"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="total-row"><span>Delivery</span><span>{cart.length ? deliveryCost ? formatMoney(deliveryCost) : 'Free' : '—'}</span></div>
            {cart.length > 0 && subtotal < freeDeliveryThreshold && <div className="total-row"><span>Free delivery over {formatMoney(freeDeliveryThreshold)}</span><span>{formatMoney(freeDeliveryThreshold - subtotal)} to go</span></div>}
            <div className="total-row grand"><span>Total</span><span>{formatMoney(subtotal + deliveryCost)}</span></div>
            <button className="checkout-button" id="checkout-button" disabled={!cart.length} onClick={() => { setDelivery('Home delivery'); setCheckoutOpen(true) }}>Continue to checkout <Icon name="arrow" size={13} /></button>
          </div>
        </section>
        <div className="delivery-card"><div className="delivery-icon"><Icon name="truck" size={16} /></div><div><strong>Free delivery over {formatMoney(freeDeliveryThreshold)}</strong><p>Same-day delivery available on orders placed before 2pm.</p></div></div>
        <div className="prescription-card">
          <strong>Have a prescription?</strong>
          <p>Send it to our pharmacy team and we'll take it from here.</p>
          <label className="upload-button" htmlFor="prescription-upload"><Icon name="upload" size={14} /> Upload prescription</label>
          <input className="prescription-input" id="prescription-upload" type="file" accept="image/*,.pdf" onChange={event => event.target.files?.[0] && setToast(`${event.target.files[0].name} selected for your pharmacist.`)} />
        </div>
      </aside>
    )
  }

  function renderShop() {
    return (
      <>
        <div className="page-heading">
          <div><div className="eyebrow">Good morning, Fabian</div><h1>Welcome to better health.</h1></div>
          <div className="date-label">Your wellness, our priority</div>
        </div>
        <div className="content-grid">
          <section className="main-column" aria-label="Browse medicines">
            <div className="hero-banner">
              <div className="hero-photo"><img src="/pharmacy-team.jpg" alt="A pharmacist helping a customer" /></div>
              <div className="hero-copy">
                <div className="hero-kicker">A healthier you starts today</div>
                <h2>Healthy today, stronger tomorrow.</h2>
                <p>Everyday essentials, trusted care, and a little peace of mind — all in one place.</p>
                <button className="hero-cta" onClick={() => document.querySelector('#medicine-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Explore medicines <Icon name="arrow" size={13} /></button>
              </div>
            </div>
            <div className="section-title-row"><h2>Shop by category</h2><span className="panel-subtitle">Find what feels right</span></div>
            <div className="category-list">
              {categories.map(item => <button key={item.name} className={`category-chip ${category === item.name ? 'selected' : ''}`} onClick={() => setCategory(item.name)}><span>{item.icon}</span>{item.name}</button>)}
            </div>
            <div className="section-title-row" id="medicine-list"><h2>Popular right now</h2><button className="text-link" onClick={() => { setCategory('All products'); setSearch(''); setSort('popular') }}>View all medicines →</button></div>
            <div className="toolbar">
              <label className="search-box"><Icon name="search" size={15} /><input type="search" placeholder="Search medicines, brands, or categories..." value={search} onChange={event => setSearch(event.target.value)} aria-label="Search medicines" /></label>
              <select className="sort-select" aria-label="Sort medicines" value={sort} onChange={event => setSort(event.target.value)}>
                <option value="popular">Sort: Popular</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name: A to Z</option>
              </select>
              <span className="product-count">{quantityLabel(visibleProducts.length)}</span>
            </div>
            <div className="product-grid">
              {visibleProducts.length ? visibleProducts.map(product => <ProductCard key={product.id} product={product} isSaved={savedItems.includes(product.id)} onToggleSaved={toggleSaved} onAdd={addToCart} />) : <div className="empty-state">No medicines found. Try another search or category.</div>}
            </div>
          </section>
          {renderCart()}
        </div>
      </>
    )
  }

  function renderOrders() {
    const reversedOrders = [...orders].reverse()
    return (
      <>
        <div className="page-heading"><div><div className="eyebrow">A little peace of mind</div><h1>My orders</h1></div><button className="text-link" onClick={() => setPage('shop')}>Continue shopping →</button></div>
        <section className="page-panel">
          <h2>Your order history</h2><p>Here’s where you can find updates on your pharmacy orders.</p>
          <div className="order-card-list">
            {reversedOrders.length ? reversedOrders.map(order => (
              <article className="order-card" key={order.id}>
                <div className="order-card-top"><div><h3>Order {order.id}</h3><p>Placed {order.date} · {order.delivery}</p></div><span className={`status-badge ${getStatusClass(order.status)}`}>{order.status}</span></div>
                <div className="order-card-items">{order.items.map(item => <div key={item.name}>{item.name} × {item.quantity}</div>)}</div>
                <div className="order-card-bottom"><span>{quantityLabel(order.items.reduce((count, item) => count + item.quantity, 0))}</span><span>{formatMoney(order.total)}</span></div>
              </article>
            )) : <div className="empty-state">You haven’t placed an order yet. Browse medicines to find your everyday essentials.</div>}
          </div>
        </section>
      </>
    )
  }

  function renderPharmacist() {
    const visibleOrders = orders.filter(order => {
      const matchesStatus = statusFilter === 'All orders' || order.status === statusFilter
      const matchesSearch = `${order.id} ${order.customer} ${order.email}`.toLowerCase().includes(orderSearch.toLowerCase())
      return matchesStatus && matchesSearch
    })
    const requestStatuses = ['New', 'Reviewing', 'Waiting on patient', 'Resolved']
    const visibleRequests = customerRequests.filter(request => {
      const matchesSearch = `${request.id} ${request.customer} ${request.type} ${request.message}`.toLowerCase().includes(orderSearch.toLowerCase())
      return matchesSearch
    })

    return (
      <>
        <div className="page-heading"><div><div className="eyebrow">Care team workspace</div><h1>Order fulfilment</h1></div><div className="date-label">{orders.length} total orders</div></div>
        <section className="page-panel">
          <h2>Customer orders</h2><p>Review incoming orders and keep customers up to date on fulfilment.</p>
          <div className="toolbar">
            <label className="search-box"><Icon name="search" size={15} /><input type="search" placeholder="Search customers or order IDs..." aria-label="Search customer orders" value={orderSearch} onChange={event => setOrderSearch(event.target.value)} /></label>
            <select className="sort-select" aria-label="Filter orders by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              {['All orders', ...statuses].map(status => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Placed</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {visibleOrders.length ? [...visibleOrders].reverse().map(order => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id}</td>
                    <td className="customer-cell"><strong>{order.customer}</strong><small>{order.email}</small></td>
                    <td>{quantityLabel(order.items.reduce((count, item) => count + item.quantity, 0))}</td>
                    <td>{formatMoney(order.total)}</td><td>{order.date}</td>
                    <td><span className={`status-badge ${getStatusClass(order.status)}`}>{order.status}</span></td>
                    <td><select className="status-select" aria-label={`Update status for ${order.id}`} value={order.status} onChange={event => updateOrderStatus(order.id, event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></td>
                  </tr>
                )) : <tr><td className="table-empty" colSpan="7">{orders.length ? 'No orders match this filter.' : 'No customer orders yet. New orders will appear here after checkout.'}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="page-panel">
          <h2>Customer request inbox</h2><p>Review direct requests from shoppers needing a nudge, confirmation, or product guidance.</p>
          <div className="requests-table-wrap">
            <table className="orders-table">
              <thead><tr><th>Request</th><th>Customer</th><th>Type</th><th>Message</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {visibleRequests.length ? visibleRequests.map(request => (
                  <tr key={request.id}>
                    <td className="order-id">{request.id}</td>
                    <td className="customer-cell"><strong>{request.customer}</strong><small>{request.date}</small></td>
                    <td>{request.type}</td>
                    <td className="request-message-cell">{request.message}</td>
                    <td><span className={`status-badge ${getRequestStatusClass(request.status)}`}>{request.status}</span></td>
                    <td><select className="status-select" aria-label={`Update request status for ${request.id}`} value={request.status} onChange={event => updateCustomerRequestStatus(request.id, event.target.value)}>{requestStatuses.map(status => <option key={status}>{status}</option>)}</select></td>
                  </tr>
                )) : <tr><td className="table-empty" colSpan="6">No customer requests yet. Requests will appear here when shoppers message the pharmacy team.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </>
    )
  }

  function renderSaved() {
    const savedProducts = products.filter(product => savedItems.includes(product.id))
    return (
      <>
        <div className="page-heading"><div><div className="eyebrow">Your little list</div><h1>Saved items</h1></div><button className="text-link" onClick={() => setPage('shop')}>Browse medicines →</button></div>
        <section className="page-panel">
          <h2>Keep your favorites close</h2><p>Your saved everyday essentials, all in one place.</p>
          <div className="product-grid">{savedProducts.length ? savedProducts.map(product => <ProductCard key={product.id} product={product} isSaved onToggleSaved={toggleSaved} onAdd={addToCart} />) : <div className="empty-state">Save a medicine with the heart icon and it will show up here.</div>}</div>
        </section>
      </>
    )
  }

  function renderRequests() {
    return (
      <>
        <div className="page-heading"><div><div className="eyebrow">Need help?</div><h1>Customer requests</h1></div><button className="text-link" onClick={() => setPage('shop')}>Back to shopping →</button></div>
        <section className="page-panel">
          <h2>Send a request to the pharmacist</h2>
          <p>Ask for medication guidance, stock checks, or help finding a suitable product.</p>
          <form className="request-form" onSubmit={submitCustomerRequest}>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="request-name">Full name</label><input id="request-name" name="name" required defaultValue="Fabian Ibeh" autoComplete="name" /></div>
              <div className="form-field"><label htmlFor="request-type">Request type</label><select id="request-type" name="type" defaultValue="Medication availability"><option>Medication availability</option><option>Prescription guidance</option><option>Product recommendation</option><option>Alternative medicine</option></select></div>
              <div className="form-field full"><label htmlFor="request-message">Message</label><textarea id="request-message" name="message" rows="5" required placeholder="Tell the pharmacist what you need help with..." /></div>
            </div>
            <button className="checkout-button" type="submit">Send request <Icon name="arrow" size={13} /></button>
          </form>
        </section>
        <section className="page-panel">
          <h2>Recent requests</h2>
          <div className="request-list">
            {customerRequests.length ? customerRequests.map(request => (
              <article className="request-card" key={request.id}>
                <div className="request-card-top">
                  <div>
                    <h3>{request.id}</h3>
                    <p>{request.customer} · {request.date}</p>
                  </div>
                  <span className={`status-badge ${getRequestStatusClass(request.status)}`}>{request.status}</span>
                </div>
                <div className="request-card-meta">{request.type}</div>
                <p className="request-message">{request.message}</p>
              </article>
            )) : <div className="empty-state">Your pharmacist requests will appear here once you send one.</div>}
          </div>
        </section>
      </>
    )
  }

  return (
    <div className="app-shell">
      {renderSidebar()}
      <main className="main-area">
        <header className="topbar">
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications" onClick={() => setPage('my-orders')}><Icon name="bell" /><span className="cart-count">{pendingNotifications}</span></button>
            <button className="icon-button" aria-label="Go to your cart" onClick={() => { setPage('shop'); window.setTimeout(() => document.querySelector('.cart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0) }}><Icon name="bag" /><span className="cart-count">{itemCount}</span></button>
          </div>
        </header>
        <div className="page-content">
          {page === 'shop' ? renderShop() : page === 'my-orders' ? renderOrders() : page === 'pharmacist' ? renderPharmacist() : page === 'requests' ? renderRequests() : renderSaved()}
        </div>
      </main>
      {checkoutOpen && <CheckoutModal subtotal={subtotal} itemCount={itemCount} deliveryFee={deliveryFee} freeDeliveryThreshold={freeDeliveryThreshold} delivery={delivery} onDeliveryChange={setDelivery} onClose={() => setCheckoutOpen(false)} onSubmit={placeOrder} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function NavButton({ active, onClick, iconName, count, children }) {
  return <button className={`nav-link ${active ? 'active' : ''}`} onClick={onClick}><Icon name={iconName} /><span className="nav-text">{children}</span>{count !== undefined && <span className="nav-count">{count}</span>}</button>
}

function CheckoutModal({ subtotal, itemCount, deliveryFee: fee, freeDeliveryThreshold, delivery, onDeliveryChange, onClose, onSubmit }) {
  const deliveryCost = subtotal >= freeDeliveryThreshold || delivery === 'Pick up at pharmacy' ? 0 : fee
  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <div className="modal-header"><div><div className="eyebrow">Almost there</div><h2 id="checkout-title">Delivery details</h2></div><button className="modal-close" onClick={onClose} aria-label="Close checkout"><Icon name="close" size={16} /></button></div>
        <form id="checkout-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="form-field"><label htmlFor="customer-name">Full name</label><input id="customer-name" name="name" required defaultValue="Fabian Ibeh" autoComplete="name" /></div>
            <div className="form-field"><label htmlFor="customer-email">Email address</label><input id="customer-email" name="email" type="email" required defaultValue="fabian.ibeh@example.com" autoComplete="email" /></div>
            <div className="form-field full"><label htmlFor="delivery-address">Delivery address</label><input id="delivery-address" name="address" required defaultValue="14B Concorde Road, Owerri, Imo State" autoComplete="street-address" /></div>
            <div className="form-field full"><label htmlFor="delivery-method">How would you like to receive it?</label><select id="delivery-method" name="delivery" value={delivery} onChange={event => onDeliveryChange(event.target.value)}><option>Home delivery</option><option>Pick up at pharmacy</option></select></div>
          </div>
          <div className="modal-summary">Order total <strong>{formatMoney(subtotal + deliveryCost)}</strong> · {quantityLabel(itemCount)}{deliveryCost ? ` · ${formatMoney(deliveryCost)} delivery` : ' · Free delivery'}</div>
          <button className="checkout-button" type="submit">Place your order <Icon name="arrow" size={13} /></button>
        </form>
      </section>
    </div>
  )
}

function getStatusClass(status) {
  return ({ Pending: 'processing', Processing: 'processing', 'Ready for pickup': 'ready', 'Out for delivery': 'ready', Completed: 'completed', Cancelled: 'cancelled' })[status] || 'processing'
}

function getRequestStatusClass(status) {
  return ({ New: 'processing', Reviewing: 'ready', 'Waiting on patient': 'processing', Resolved: 'completed' })[status] || 'processing'
}

export default App
