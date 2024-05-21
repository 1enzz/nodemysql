const {
    createPool
} = require('mysql');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const port = 3000; // Escolha a porta que deseja usar para o servidor
app.use(bodyParser.json());
app.use(cors());


const pool = createPool({
    host: "localhost",
    user: "adm",
    password:"NvEn$$01%",
    database: "bdclimup",
    connectionLimit: 10,
    insecureAuth: true
})


//login empresa
app.post('/api/loginEmpresa', (req, res)=>{
    const {cnpjEmpresa, senhaEmpresa} = req.body;
    pool.query('SELECT idEmpresa, nomeEmpresa, senhaEmpresa FROM tbempresa where cnpjEmpresa = ?', [cnpjEmpresa], (error,result) =>{
        //quando o if tem como parametro somente uma variavel, verificamos se essa variavel retorna true ou false
        //nessa relação com banco quando da algum erro no banco, error retorna true sempre por padrão
        if(error){
            return res.status(500).json({ message: 'Erro ao fazer login' });
        }


        //aqui verifica se houve alguma resposta da nossa requisição inicial, se houve algum retorno do select com cnpj
        //se não houve, o result.lenght vai ser 0 e vai retornar para a aplicação erro
        if(result.length === 0){
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });

        }
        //caso seja maior q zero, vamos pegar a primeira posição do nosso array q armazena o resultado da query
        //e armazenar em uma variavel chamada resquery para manipular os dados de retorno mais facilmente

        const resquery = result[0];
        

        //aqui verificamos se a senha q o nosso usuario enviou da tela é diferente da que retornou do banco de dados, de acordo com o cnpj fornecido
        //se nao for, retorna um código de erro junto com a mensagem de erro
        if(senhaEmpresa !== resquery.senhaEmpresa){
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
        }

        //caso seja igual, pegamos o id e o nome enviados na query e mandamos de volta para tela

        const id = resquery.idEmpresa;
        const nmEmpresa = resquery.nomeEmpresa;
        return res.status(200).json({retorno: 'Login bem sucedido', nmEmpresa,id});
    })
})


//login coolaboradores
app.post('/api/loginColaborador', (req, res)=>{
    const {emailColaborador, senhaColaborador} = req.body;
    pool.query(`SELECT  idColaborador, 
                        nomeColaborador, 
                        senhaColaborador, 
                        e.nomeEmpresa as empresa 
                FROM tbcolaborador c inner join tbempresa e on e.idempresa = c.idempresa where emailColaborador = ?`, [emailColaborador], (error,result) =>{
        //quando o if tem como parametro somente uma variavel, verificamos se essa variavel retorna true ou false
        //nessa relação com banco quando da algum erro no banco, error retorna true sempre por padrão
        if(error){
            return res.status(500).json({ message: 'Erro ao fazer login' });
        }


        //aqui verifica se houve alguma resposta da nossa requisição inicial, se houve algum retorno do select com cnpj
        //se não houve, o result.lenght vai ser 0 e vai retornar para a aplicação erro
        if(result.length === 0){
            return res.status(401).json({ message: 'Email ou senha incorretos' });

        }
        //caso seja maior q zero, vamos pegar a primeira posição do nosso array q armazena o resultado da query
        //e armazenar em uma variavel chamada resquery para manipular os dados de retorno mais facilmente

        const resquery = result[0];
        

        //aqui verificamos se a senha q o nosso usuario enviou da tela é diferente da que retornou do banco de dados, de acordo com o email fornecido
        //se nao for, retorna um código de erro junto com a mensagem de erro
        if(senhaColaborador !== resquery.senhaColaborador){
            return res.status(401).json({ message: 'Email ou senha incorretos' });
        }

        //caso seja igual, pegamos o id e o nome enviados na query e mandamos de volta para tela

        const id = resquery.idColaborador;
        const nmColaborador = resquery.nomeColaborador;
        const nmEmpresa = resquery.empresa;
        return res.status(200).json({retorno: 'Login bem sucedido', nmColaborador,id, nmEmpresa} );
    })
})

//select colaboradores
app.get('/api/colaboradores', (req, res) => {
    pool.query('SELECT * FROM tbcolaborador', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500);
        }
        return res.status(200).json(results);
    });
});

//select empresas
app.get('/api/empresa',(req,res) =>{
    pool.query('select * from tbempresa', (error, results) =>{
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar empresas' });
        }
        return res.status(200).json(results);
    });
})

// insert colaboradores
app.post('/api/colaboradores', (req, res) => {
    const colaboradores = req.body;

    if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
        return res.status(400).json({ message: 'Nenhum departamento fornecido para inserção' });
    }

    const valores = colaboradores.map(colaborador => [colaborador.nomeColaborador, colaborador.cargoColaborador, colaborador.emailColaborador, colaborador.senhaColaboradorPadrao, colaborador.idadeColaborador, colaborador.sexoColaborador, colaborador.idEmpresa]);
    const query = ` INSERT INTO tbcolaborador (nomeColaborador, cargoColaborador, emailColaborador, senhaColaboradorPadrao, idadeColaborador, sexoColaborador, idEmpresa) VALUES ?`;
    pool.query(query, [valores], (error, results, fields) => {
        
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir colaborador' });
        }
        return res.status(200).json({ message: 'Colaborador inserido com sucesso' });
    });
});

//insert empresa
app.post('/api/empresa', (req, res) => {
    const { nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa } = req.body;

    const query = 'INSERT INTO tbempresa (nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa], (error, results, fields) => {
        
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir colaborador' });
        }
        return res.status(200).json({ message: 'Empresa cadastrada com sucesso' });
    });
});

//insert departamento
app.post('/api/departamento', (req, res) => {
    const departamentos = req.body; // Recebe o array JSON de departamentos

    // ve se o item enviado é diferente de array ou se o tamanho é igual a zero, se for ele retorna erro se nao prossegue a insercao
    if (!Array.isArray(departamentos) || departamentos.length === 0) {
        return res.status(400).json({ message: 'Nenhum departamento fornecido para inserção' });
    }

    const query = 'INSERT INTO tbdepartamento (nomeDepartamento, idEmpresa) VALUES ?'; 
    const values = departamentos.map(departamento => [departamento.nomeDepartamento, departamento.idEmpresa]); //extrai somente os valores q estavam contidos na variavel departamento, q recebia o json do corpo da requisicao
    pool.query(query, [values], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir departamentos' });
        }
        return res.status(200).json({ message: 'Departamentos cadastrados com sucesso' });
    });
});

//insert cargo
app.post('/api/cadastraCargo', (req, res) => {
    const cargos = req.body; // Recebe o array JSON de departamentos

    // ve se o item enviado é diferente de array ou se o tamanho é igual a zero, se for ele retorna erro se nao prossegue a insercao
    if (!Array.isArray(cargos) || cargos.length === 0) {
        return res.status(400).json({ message: 'Nenhum departamento fornecido para inserção' });
    }

    const query = 'INSERT INTO tbcargo (nomeCargo, idDepartamento, idEmpresa ) VALUES ?'; 
    const values = cargos.map(cargo => [cargo.nomeCargo, cargo.idDepartamento, cargo.idEmpresa ]); //extrai somente os valores q estavam contidos na variavel departamento, q recebia o json do corpo da requisicao
    pool.query(query, [values], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir departamentos' });
        }
        return res.status(200).json({ message: 'Departamentos cadastrados com sucesso' });
    });
});

//retorna cargos
app.post('/api/retornaCargos', (req, res) =>{
    const {idEmpresa} = req.body;
    pool.query(`SELECT 	idcargo as Id, 
                        c.nomecargo as Cargo, 
                        d.nomeDepartamento as Departamento 
                FROM tbcargo c 
                INNER JOIN tbdepartamento d on d.iddepartamento = c.iddepartamento
                WHERE c.idempresa = ?`, [idEmpresa], (error,result) =>{
        if(error){
            console.log(error)
            return res.status(500).json({ message: 'Erro ao trazer departamentos' });
           
        }
        let arraydata = []
        const quant = result.length;
        for(i = 0; i < result.length; i++){
            arraydata.push( result[i] )
        }
        res.status(200).json({ cargos: arraydata, total :quant });
    })

});


app.post('/api/retornaDepartamentos', (req, res) =>{
    const {idEmpresa} = req.body;
    pool.query(`SELECT
                        d.idDepartamento as Id, 
                        d.nomeDepartamento as Departamento, 
                        c.nomecolaborador as Responsavel 
                FROM tbdepartamento d left JOIN tbcolaborador c ON c.idcolaborador = d.idcolaboradorresponsavel 
                where d.idEmpresa = ?`, [idEmpresa], (error,result) =>{
        if(error){
            return res.status(500).json({ message: 'Erro ao fazer login' });
        }
        let arraydata = []
        const quant = result.length;
        for(i = 0; i < result.length; i++){
            arraydata.push( result[i] )
        }
        res.status(200).json({ departamentos: arraydata, total :quant });
    })

});

app.post('/api/retornaColaboradores', (req, res) =>{
    const {idEmpresa} = req.body;
    pool.query(`select 	cl.idcolaborador as Id,
                        cl.nomecolaborador as Nome,
                        cg.nomeCargo as Cargo,
                        cl.emailcolaborador as Email,
                        cl.idadeColaborador as Idade
                from tbcolaborador cl 
                left join tbcargo cg on cg.idcargo = cl.cargocolaborador
                where cl.idempresa = ? order by 1 desc`, [idEmpresa], (error,result) =>{
        if(error){
            console.log(error)
            return res.status(500).json({ message: 'Erro ao trazer departamentos' });
           
        }
        let arraydata = []
        const quant = result.length;
        for(i = 0; i < result.length; i++){
            arraydata.push( result[i] )
        }
        res.status(200).json({ colaboradores: arraydata});
    })

});

app.post('/api/retornaParametrosTelas', (req,res) =>{
    const {idEmpresa} = req.body;
    pool.query(`select  (select count(d.iddepartamento) 
                            from tbdepartamento d where d.idempresa = e.idempresa) as quantd,
                        (select count(cg.idcargo) 
                            from tbcargo cg where cg.idempresa = e.idempresa) as quantcg, 
                        (select count(cl.idcolaborador) 
                            from tbcolaborador cl where cl.idempresa = e.idempresa) as quantcl,
                        (select count(pg.idpergunta)
                            from tbpergunta pg where pg.idempresacadastro = e.idempresa) as quantpg 
                from tbempresa e where e.idempresa = ?`, [idEmpresa], (error, result) =>{
                
                    if(error){
                        return res.status(500).json({ message: 'Erro ao buscar empresas' });
                    }

                    const retorno = result[0]
                    res.status(200).json({retorno})
            })
})

app.post('/api/retornaDepartamentoSelect', (req,res) =>{


    const {idEmpresa} = req.body;
    pool.query(`select idDepartamento as Id, nomeDepartamento as Departamento from tbdepartamento where idempresa = ?`, [idEmpresa], (error, result) =>{
                
                    if(error){
                        return res.status(500).json({ message: 'Erro ao buscar empresas' });
                    }

                    const retorno = result
                    res.status(200).json({retorno})
            })
})


app.post('/api/retornaCargoSelect', (req, res) =>{
    const {idEmpresa} = req.body;
    pool.query(`SELECT 	idcargo as Id, 
                        c.nomecargo as Cargo 
                FROM tbcargo c 
                WHERE c.idempresa = ?`, [idEmpresa], (error,result) =>{
        if(error){
            console.log(error)
            return res.status(500).json({ message: 'Erro ao trazer departamentos' });
           
        }
        let arraydata = []
        const quant = result.length;
        for(i = 0; i < result.length; i++){
            arraydata.push( result[i] )
        }
        res.status(200).json({ cargos: arraydata});
    })

});

app.listen(port, () => {
    console.log(`Servidor Node.js está executando na porta ${port}`);
});


 
