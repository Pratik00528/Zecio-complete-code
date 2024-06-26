import React from 'react'
import { Layout } from '../components/Layout/Layout'
import { useCart } from '../Context/cart'
import { useAuth } from '../Context/Auth'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DropIn from "braintree-web-drop-in-react";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import "../Styles/CartStyles.css"

export const CartPage = () => {

    const [cart, setCart] = useCart();
    const [auth, setAuth] = useAuth();

    const [clientToken, setClientToken] = useState("")
    const [instance, setInstance] = useState("")
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate();

    // Calculating total price of all products in cart
    const totalPrice = () => {
        try {

            let total = 0
            cart?.map((item) => { total = total + item.price })

            return total.toLocaleString("en-US", {
                style: "currency",
                currency: "USD"
            })


        } catch (error) {
            console.log(error)

        }
    }

    // Remove Cart Item
    const removeCartItem = (pid) => {
        try {

            let myCart = [...cart]
            let index = myCart.findIndex((item) => item._id === pid)
            myCart.splice(index, 1)
            setCart(myCart);
            localStorage.setItem("cart", JSON.stringify(myCart))


        } catch (error) {
            console.log(error)

        }

    }

    // Get Payment Gateway Token
    const getToken = async () => {
        try {

            const { data } = await axios.get(`${process.env.REACT_APP_API}/api/v1/product/braintree/token`)
            setClientToken(data?.clientToken)

        } catch (error) {
            console.log(error)

        }
    }

    useEffect(() => {
        getToken();
    }, [auth?.token])


    // Handle Payment
    const handlePayment = async () => {
        try {

            setLoading(true)
            const { nonce } = await instance.requestPaymentMethod();
            const { data } = await axios.post(`${process.env.REACT_APP_API}/api/v1/product/braintree/payment`, { nonce, cart })
            setLoading(false)
            localStorage.removeItem("cart")
            setCart([])
            navigate("/dashboard/user/orders")
            setTimeout(() => { toast.success("Payment completed successfully") }, 1500);

        } catch (error) {
            console.log(error)
            setLoading(false);
        }
    }

    return (
        <Layout title="Your Cart">
            <div className="cart-page">
                <div className="row">
                    <div className="col-md-12">
                        <h1 className="text-center bg-light p-2 mb-3">
                            {!auth?.user
                                ? "Hello Guest"
                                : `Hello  ${auth?.token && auth?.user?.name}`}
                            <p className='text-center'>
                                {cart?.length > 0
                                    ? `You have ${cart?.length} ${cart?.length === 1 ? "item" : "items"} in your cart. ${auth?.token ? "" : "Please Login to checkout!"}`
                                    : "Your cart is empty."}

                            </p>
                        </h1>
                    </div>
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-md-6 p-0 m-3">
                            {cart?.map((p) => (
                                <div className="row card flex-row">
                                    <div className="col-md-4">
                                        <img src={`${process.env.REACT_APP_API}/api/v1/product/product-photo/${p._id}`}
                                            className="card-img-top" alt={p.name}
                                            width="100%"
                                            height={"150px"}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <p>{p.name}</p>
                                        <p>{p.description.substring(0, 60)}...</p>
                                        <p>Price: $ {p.price}</p>
                                    </div>
                                    <div className="col-md-4 cart-remove-btn">
                                        <button className='btn btn-danger' onClick={() => { removeCartItem(p._id) }} >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="col-md-5 cart-summary">
                            <h2>Cart Summary</h2>
                            <p>Total | Checkout | Payment</p>
                            <hr />
                            <h2>Total : {totalPrice()}</h2>
                            {auth?.user?.address ? (
                                <>
                                    <div className="mb-3">
                                        <h4>Current Address: {auth?.user.address}</h4>
                                        <button className='btn btn-outline-warning'
                                            onClick={() => navigate("/dashboard/user/profile")}>
                                            Update Address</button>
                                    </div>
                                </>
                            ) : (
                                auth?.token ? (
                                    <button className='btn btn-outline-warning'
                                        onClick={() => navigate("/dashboard/user/profile")}>
                                        Update Address</button>
                                ) : (
                                    <button className='btn btn-outline-warning'
                                        onClick={() => navigate("/login", {
                                            state: "/cart"
                                        })}>
                                        Please Login to checkout!</button>
                                )
                            )}
                            <div className="mt-2">
                                {
                                    !clientToken || !cart?.length ? ("") : (

                                        <>
                                            <DropIn
                                                options={{
                                                    authorization: clientToken,
                                                    paypal: {
                                                        flow: 'vault'
                                                    }
                                                }}
                                                onInstance={(instance) => { setInstance(instance) }}
                                            />
                                            <button className='btn btn-success' onClick={handlePayment}
                                                disabled={loading || !instance || !auth?.user?.address}>
                                                {loading ? "Processing..." : "Make Payment"}
                                            </button>
                                        </>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    )
}
