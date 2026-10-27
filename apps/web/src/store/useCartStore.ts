import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

//Định nghĩa tất cả những gì giỏ hàng có thể làm
interface CartState{
    items: CartItem[];
    addToCart:(product:Product, size: 'S' | 'M' | 'L', toppings:string[], unitPrice: number)=>void;
    updateQuantity:(cartItemId:string | number, delta: number)=>void;
    removeFromCart:(cartItemId:string|number)=>void
    clearCart:()=>void;
    getTotalItems:()=>number;
    getTotalPrice:()=>number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            //1.thêm hàng vào giỏ
            addToCart:(product, size, toppings, unitPrice)=>{
                //tạo mã phân biệt: "id-size-topping"
                const sortedToppings=[...toppings].sort().join(',');
                const cartItemId=`${product.id}-${size}-${sortedToppings}`;

                const existingItem=get().items.find((i)=>i.cartItemId===cartItemId);

                if(existingItem){
                    //kiểm tra trong giỏ hàng xem có sản phẩm nào giống không để tăng số lượng lên 1
                    set({
                        items: get().items.map((item)=>
                            item.cartItemId === cartItemId ? {...item, quantity: item.quantity+1} : item),
                    });
                } else{
                    //kiểm tra nếu là món mới hoặc cùng món nhưng khác size thì thêm mới vào giỏ hàng
                    const newItem:CartItem={
                        cartItemId,
                        product,
                        size,
                        toppings,
                        quantity:1,
                        unitPrice,
                    };
                    set({items: [...get().items,newItem] });
                }
            },

            //2.Tăng giảm số lượng 
            updateQuantity: (cartItemId, delta) =>
            {
                set({
                    items: get()
                        .items.map((item)=>{
                            if(item.cartItemId === cartItemId ){
                                const newQty = Math.max(1, item.quantity + delta);
                                return {...item, quantity:newQty};
                            }
                            return item;
                        }),
                });
            },

            //3.Xóa khỏi giỏ hàng
            removeFromCart:(cartItemId) => {
                set({
                    items:get().items.filter((item)=>item.cartItemId !== cartItemId),
                });
            },

            //4.dọn dẹp giỏ hàng sau khi thanh toán thành công
            clearCart:()=>set({items:[] }),

            //5.Đếm tổng sản phẩm trong giỏ hàng
            getTotalItems: ()=>{
                return get().items.reduce((total, item)=>total+item.quantity, 0);
            },

            //6. tính tổng tiền sản phẩm trong giỏ hàng
            getTotalPrice: ()=>{
                return get().items.reduce(
                    (total, item)=>total+ item.unitPrice * item.quantity, 0
                );
            },
        }),

        {name: 'brewlite-cart-storage',} //lưu sản phẩm + trạng thái giỏ hàng vào localStorage
    )
);


