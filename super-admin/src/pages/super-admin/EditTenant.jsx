import { useNavigate, useLocation } from "react-router-dom";
import TenantForm from "../../components/super-admin/TenantForm";
import api from "../../utils/api";
import toast from "react-hot-toast";


function EditTenant(){

const navigate = useNavigate();
const {state}=useLocation();


const updateTenant = async(formData)=>{

try{

await api.put(
`/api/admin/tenants/${state.tenant._id}`,
formData
);

toast.success("Tenant updated");

navigate("/super-admin/tenants");

}
catch(err){

toast.error("Update failed");

}

}


return (

<TenantForm

isOpen={true}

initialData={state?.tenant}

onClose={()=>navigate("/super-admin/tenants")}

onSubmit={updateTenant}

/>

)

}

export default EditTenant;