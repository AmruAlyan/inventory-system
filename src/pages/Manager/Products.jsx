import React from "react";
import AddCategoryWidget from "../../components/addCategory";
import AddProductWidget from "../../components/addProductWidget";
import Inventory from "../../components/inventory";

const Products = () => {

    return (
        <div>
            <Inventory />
            {/* <AddProductWidget />
            <AddCategoryWidget /> */}
        </div>
    );
};
export default Products;