const express = require('express');
const app = express();
const port = 3000;
const pool  = require('./db');

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.send('Welcome to the K_shop!🥨');
});
app.listen(port, () => {
    console.log(`🚀 StoreFront is open at http://localhost:${port}`);
});

// Function to create a new product
async function createProduct(sku, name, price, stock, description) {
    const query = 'INSERT INTO products (sku, name, price, stock, description) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const values = [sku, name, price, stock, description];
    try {
        const res = await pool.query(query, values);
        console.log('✅Product created:', res.rows[0].name);
        return res.rows[0];
    } catch (err) {
        console.error('❌Error creating product:', err.message);
    }
}
//Function to get all products or search products by name or description
app.get('/products', async (req, res) => {
    try {
        const searchQuery = req.query.search;
        let result;
        
        if (searchQuery) {
            const query = 'SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1';
            result = await pool.query(query, [`%${searchQuery}%`]);
        } else {
            result = await pool.query('SELECT * FROM products');
        }
        res.json(result.rows);
    } catch (err) {
        console.error('❌Error fetching products:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }   
});
app.get('/search', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
            return res.json([]);
        }
        const result = await pool.query(
            'SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1',
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌Error searching products:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }   
});

//Function to update a product
async function updateProduct(id, price, stock) {
    //we encrypt the price and stock before updating
    const query = 'UPDATE products SET price = $1, stock = $2 WHERE id = $3 RETURNING *';
    const values = [price, stock, id];
    try {
        const res = await pool.query(query, values);
        console.log('✅Product updated:', res.rows[0].name);
        return res.rows[0];
    } catch (err) {
        console.error('❌Error updating product:', err.message);
    }   
}
//function to delete a product
async function deleteProduct(id) {
    try {
        const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
        const res = await pool.query(query, [id]);
        
        if (res.rowCount === 0) {
            console.log('⚠️No product found with id:', id);
        } else {
            console.log('✅Product deleted:', res.rows[0].name);
        }
    } catch (err) {
        console.error('❌Error deleting product:', err.message);
    }  
}
//cart management functions
let cart = [];

function addToCart(productId, productName, price, quantity) {
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    }
    else {
        cart.push({ productId, productName, price, quantity });
    }
    rendercart();
    console.log('🛒Product added to cart:', productId, 'Quantity:', quantity)
};
//update cart item quantity
function updateCartItem(productId, quantity) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity = quantity;

        if (item.quantity <= 0) {
            removeFromCart(productId);
        }
    else {
        console.log('⚠️Cart item not found:', productId);
    }  
    rendercart();       
    }
};
//remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    rendercart();
    console.log('🛒Product removed from cart:', productId);
}
//render cart items
function rendercart() {
    const cartlist = document.getElementById('cart-items');
    const badege = document.getElementById('cart-badge');
    const totalDisplay = document.getElementById('total');

    //clear existing items
    cartlist.innerHTML = '';

    let totalvalue = 0;
    let totalquantity = 0;

    cart.forEach(item => {
        totalvalue += item.price * item.quantity;
        totalquantity += item.quantity;

        //create cart item element
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.productName} - $${Number(item.price).toFixed(2)}
            <button onclick="updateCartItem('${item.productId}', ${item.quantity - 1})">-</button>
            <button onclick="updateCartItem('${item.productId}', ${item.quantity + 1})">+</button>
        `;
        cartlist.appendChild(li);
    });

    //update total and badge
    if (badge) badge.innerText = totalquantity;
    totalDisplay.innerText = `Total: $${totalvalue.toFixed(2)}`
}
