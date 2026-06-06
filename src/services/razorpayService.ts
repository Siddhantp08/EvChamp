declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
  callback_url?: string;
  readonly?: {
    amount: boolean;
  };
}

export interface OrderDetails {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

class RazorpayService {
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.REACT_APP_RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.REACT_APP_RAZORPAY_KEY_SECRET || '';
  }

  // Initialize Razorpay script
  loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  }

  // Create order on your backend (you'll need to implement this)
  async createOrder(amount: number, currency: string = 'INR'): Promise<OrderDetails> {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      // For demo purposes, create a mock order (no order_id)
      return {
        id: '',
        amount: amount * 100,
        currency,
        receipt: `receipt_${Date.now()}`,
        status: 'created',
      };
    }
  }

  // Initialize payment
  async initializePayment(
    amount: number,
    name: string,
    description: string,
    userEmail?: string,
    userName?: string
  ): Promise<void> {
    try {
      // Verify key is loaded
      console.log('Razorpay Key ID:', this.keyId ? 'Loaded ✓' : 'NOT LOADED ✗');
      if (!this.keyId) {
        throw new Error('Razorpay Key ID not configured. Please add REACT_APP_RAZORPAY_KEY_ID to .env');
      }

      await this.loadScript();

      const order = await this.createOrder(amount);

      const options: PaymentOptions = {
        key: this.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'EVChamp',
        description,
        ...(order.id ? { order_id: order.id } : {}),
        prefill: {
          name: userName,
          email: userEmail,
        },
        notes: {
          address: 'EVChamp Office, India',
        },
        theme: {
          color: '#10B981', // Green color matching your theme
        },
        // Redirect to your Razorpay.me link
        callback_url: 'https://razorpay.me/@zipsureai',
        // Prevent amount editing
        readonly: {
          amount: true
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.success', (response: any) => {
        console.log('Payment successful:', response);
        this.handlePaymentSuccess(response, order);
      });

      razorpay.on('payment.failed', (response: any) => {
        console.log('Payment failed:', response);
        this.handlePaymentFailure(response);
      });

      razorpay.open();
    } catch (error) {
      console.error('Error initializing payment:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  }

  // Handle successful payment
  private handlePaymentSuccess(response: any, order: OrderDetails): void {
    // You can implement your success logic here
    // For example, redirect to success page, update database, etc.
    console.log('Payment successful:', response);
    
    // Redirect to success page with payment details
    const params = new URLSearchParams({
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    });
    
    window.location.href = `/payment-success?${params.toString()}`;
  }

  // Handle failed payment
  private handlePaymentFailure(response: any): void {
    alert('Payment failed. Please try again.');
  }

  // Verify payment signature (implement on backend)
  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<boolean> {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          orderId,
          signature,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.verified;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }
}

const razorpayServiceInstance = new RazorpayService();
export default razorpayServiceInstance;
